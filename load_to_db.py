# -*- coding: utf-8 -*-
__author__ = 'Janin Koch'


import ast
import psycopg2
import settings
from colorthief import ColorThief
from PIL import Image

def insert_element(el_name, path, width, height, palette, word, url):
    if len(word)> 2:
        x = ast.literal_eval(word)
        print(x[0], 'encoded',  x[0].encode('utf-8'))
        word_to_insert = [item.strip().encode('utf-8') for item in x]
        # word_to_insert = [w.strip() for w in word_to_insert]
    else:
        word_to_insert = "[upload]"


    p_list = str(map(str, palette))
    palette_list = p_list.replace('[', '{').replace(']', '}').replace('(', '{').replace(')', '}').replace("'", "")

    connection = psycopg2.connect(settings.DATABASE_CONNECTION_STRING)
    cur = connection.cursor()

    cur.execute('''
        INSERT INTO images (name, location, width, height, palette, query_word, url ) 
        VALUES 
        (%s, %s, 
        %s, %s, 
        %s, %s, 
        %s
        )
        ''', (
        el_name, path, width, height, palette_list, str(word_to_insert), url))
    connection.commit()
    cur.close()
    connection.close()
    return "Done"


def insert_lables(img_name, labels):
    connection = psycopg2.connect(settings.DATABASE_CONNECTION_STRING)
    cur = connection.cursor()
    x = ast.literal_eval(labels)
    labels_to_insert = [item.encode('utf-8') for item in x]
    labels_to_insert[0] = labels_to_insert[0].replace("'[", "")
    labels_to_insert[-1] = labels_to_insert[-1].replace("]'", "")
    labels_to_insert= [label.replace("'", "") for label in labels_to_insert]

    cur.execute('''
        Update images set labels = '{'%s'}' where name = %s ''', (str(labels_to_insert), img_name))
    connection.commit()
    cur.close()
    connection.close()
    return "Done"


# checks if image with this name is in db
def already_there(img_url):
    connection = psycopg2.connect(settings.DATABASE_CONNECTION_STRING)
    cur = connection.cursor()
    cur.execute("SELECT name,labels,palette FROM images WHERE url = %s;", (img_url,))
    img_data = cur.fetchall()
    cur.close()
    connection.close()

    if img_data:
        return img_data
    else:
        return 0, 0





def already_there_values(name):
    connection = psycopg2.connect(settings.DATABASE_CONNECTION_STRING)
    cur = connection.cursor()
    cur.execute("SELECT name,labels,palette FROM images WHERE name = %s;", (name,))
    img_data = cur.fetchall()
    cur.close()
    connection.close()
    return img_data






def remove_similar_colors(palette, remove_criterion, verbose=False):

    remove = []

    for i, color in enumerate(palette[:-1]):
        if verbose:
            print i, color
        for j, c2 in enumerate(palette[i+1:]):
            if verbose:
                print '\tcompared to', j, c2
            if (abs(color[0] - c2[0]) < remove_criterion) and (abs(color[1] - c2[1]) < remove_criterion) and (abs(color[2] - c2[2]) < remove_criterion):
                remove.append(j+i)
                if verbose:
                    print '\t\twill be deleted'

    remove = sorted(list(set(remove)))
    for i in reversed(remove):
        del palette[i]

    return palette

# Calculates image features in format as in db
# transparency: -1 transparency is considered, 1 no transparency
def get_image_features(el_name, path, transparency, remove_criterion=10):

    #color palette
    img = Image.open(path + '/' + el_name)
    color_thief = ColorThief(path + '/' + el_name)
    palette = color_thief.get_palette(color_count=10)

    if remove_criterion is not None:
        palette = remove_similar_colors(palette, remove_criterion)

    # dimension
    width,height = img.size

    return width, height, palette


# puts data/features of images with file ending .png, .jpg and .jpeg into the data base if they are not already there
def get_data(file, word, url):
    path = "static/images/"

    if file.endswith(".png") or file.endswith(".jpg") or file.endswith(".jpeg"):
        width, height, palette = get_image_features(file, path, -1)
        inserted = insert_element(file, path, width, height, palette, word, url)
        return palette
    else:
        return 0
