# -*- coding: utf-8 -*-
__author__ = 'Janin Koch'

main = None
from api import *
from analyse_images import *
import time
import web
import json
from PIL import Image
import requests
from StringIO import StringIO



urls = (
    '/', 'Welcome',
    '/moodboard', 'Main_Interface',
    '/update', 'Update',
    '/search', 'Search',
    '/load', 'Load',
    '/load_labels', 'Load_Labels',
    '/load_colors', 'Load_Colors',
    '/load_crop', 'Load_Crop',
    '/save_mb', 'Save_MB',
    '/upload_image', 'Upload_Image'
)

render = web.template.render('templates/')
web.config.obj = {'name': None}


class Welcome:
    def GET(self):
        return render.Welcome()


    def POST(self):
        data = web.input()
        name = data.name
        web.config.obj['name'] = name
        self.start(name)


    def start(self, name):
        global main
        main = Main(name)


class Search:
    def POST(self):
        data = json.loads(web.data())
        search_results = search(data)
        pyDict2 = {}
        for index in range(0, len(search_results)):
            pyDict2[index] = search_results[index]

        web.header('Content-Type', 'application/json')
        return json.dumps(pyDict2)


class Load:
    def POST(self):
        data = json.loads(web.data())
        dropped_image = str(data['image'])
        search_term = str(data['search_term'])

        file_name, labels, palette = load_images_search(search_term, dropped_image)
        if labels != 0 and labels != None:
            labels[0] = labels[0].replace("'[", "")
            labels[-1] = labels[-1].replace("]'", "")
        if palette != 0 and palette != None and type(palette) is not list:
            palette[0] = palette[0].replace("'[", "")
            palette[-1] = palette[-1].replace("]'", "")
            palette[1:-1] = palette.replace("{", "(").replace("}", ")")

        pyDictName = {'imgSrc': file_name, 'labels': labels, 'colorPalette': palette}
        web.header('Content-Type', 'application/json')
        return json.dumps(pyDictName)


class Upload_Image:
    def POST(self):

        data = web.input()
        data_info = web.storify(data).image
        filename = randomString('x.png');
        fullPath = "static/images/" + filename

        outfile = open(fullPath, 'wb')
        outfile.write(data_info)
        outfile.close()

        palette = get_data(filename, "[u'upload']", 'upload')
        labels = 0;

        pyDictName = {'imgSrc': fullPath, 'labels': labels, 'colorPalette': palette}
        web.header('Content-Type', 'application/json')
        return json.dumps(pyDictName)


class Load_Labels:
    def POST(self):
        data = json.loads(web.data())
        image_labels = str(data['labels'])
        name = str(data['path'])
        name = name.replace('http://localhost:8080/static/images/', '');

        labels = insert_lables(name, image_labels)

        pyDictName = {'labels': labels}
        web.header('Content-Type', 'application/json')
        return json.dumps(pyDictName)




class Load_Colors:
    def POST(self):
        data = json.loads(web.data())
        image = str(data['image'])
        name = image.replace('static/images/', '');
        file_name, labels, palette = get_image_values(name)
        if labels != 0 and labels != None:
            labels[0] = labels[0].replace("'[", "")
            labels[-1] = labels[-1].replace("]'", "")
        if palette != 0 and palette != None and type(palette) is not list:
            palette[0] = palette[0].replace("'[", "")
            palette[-1] = palette[-1].replace("]'", "")
            palette[1:-1] = palette.replace("{", "(").replace("}", ")")

        pyDictName = {'labels': labels, 'colorPalette': palette}
        web.header('Content-Type', 'application/json')
        return json.dumps(pyDictName)



class Load_Crop:
    def POST(self):
        data = json.loads(web.data())
        image_raw = data['image']
        # data:image/png;base64,
        datatype = image_raw[image_raw.find('/') + 1:image_raw.find(';')]
        image_clear = image_raw[image_raw.find(','):]

        cropped_image = image_clear.decode('base64')
        search_term = str(data['search_term'])
        filename = randomString('x.' + datatype);

        fullPath = "static/images/" + filename
        with open(fullPath, "wb") as fh:
            fh.write(cropped_image)

        palette = get_data(filename, search_term, 'cropped')
        labels = 0;

        pyDictName = {'imgSrc': fullPath, 'labels': labels, 'colorPalette': palette}
        web.header('Content-Type', 'application/json')
        return json.dumps(pyDictName)

class Save_MB:
    def POST(self):
        data = json.loads(web.data())
        name = web.config.obj['name']
        time_stamp = time.time()
        with open('static/versioning/' + str(name) + '_' + str(time_stamp) + '.txt', 'w') as outfile:
            json.dump(data['content'], outfile)


class Main_Interface:
    def GET(self):
        return render.Main()


    def POST(self):
        input = web.input()
        web.header('Content-Type', 'application/json')


class Main:
    def __init__(self, name):
        self.name = name
        web.seeother('/moodboard')


    def set_mb(self, name, path="static/moodboards"):
        self.moodboard_data = get_image_features(name, path, -1)


def load_images_search(word, url):
    # get images and filter text out
    if not url.startswith('http'):
        url = "http://" + url

    response = requests.get(url, headers={'User-Agent': 'Custom'})
    im = Image.open(StringIO(response.content))

    if url.endswith('png'):
        im = im.convert('RGBA')
    else:
        im = im.convert('RGB')


    filename = randomString(url);
    fullPath = "static/images/" + filename

    # load data to db
    db_results = already_there(url)

    if db_results and db_results[0] != 0:
        if len(db_results[0]) < 2 or db_results[0][1] == None:
            if len(db_results[0][2]) > 1:
                return "static/images/" + db_results[0][0], 0, db_results[0][2]
            else:
                return "static/images/" + db_results[0][0], 0, 0
        else:
            return "static/images/" + db_results[0][0], db_results[0][1], db_results[0][2]


    else:
        im.save(fullPath)
        palette = get_data(filename, word, str(url))
        return fullPath, 0, palette


def get_image_values(name):
    db_results = already_there_values(name)
    return "static/images/" + db_results[0][0], db_results[0][1], db_results[0][2]


def randomString(url, stringLength=30):
    """Generate a random string of fixed length """
    Letters = string.ascii_lowercase + string.ascii_uppercase + string.digits
    url_split = url.split(".")

    format_ = url_split[-1]
    s = ''.join(random.choice(Letters) for i in range(stringLength)) + "." + format_

    if alreadyNameInDB(s):
        randomString(url)
    else:
        return s


def alreadyNameInDB(name):
    connection = psycopg2.connect(settings.DATABASE_CONNECTION_STRING)
    cur = connection.cursor()

    cur.execute("SELECT name FROM images WHERE name = '%s';".format(name, ))
    return cur.fetchone() is not None


if __name__ == "__main__":
    app = web.application(urls, globals())
    app.run()
