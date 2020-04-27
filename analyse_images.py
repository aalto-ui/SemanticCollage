# encoding=utf8

from load_to_db import *
save_list = []
import random
import string


def randomString(url, stringLength=20):
    """Generate a random string of fixed length """
    Letters = string.ascii_lowercase + string.ascii_uppercase + string.digits
    url_split = url.split(".")
    format_ = url_split[-1]
    s = ''.join(random.choice(Letters) for i in range(stringLength)) + format_

    if alreadyNameInDB(s):
        randomString(url)
    else:
        return s


def alreadyNameInDB(name):
    connection = psycopg2.connect(settings.DATABASE_CONNECTION_STRING)
    # connection = psycopg2.connect(database='Inspiration', user='research')
    cur = connection.cursor()

    cur.execute("SELECT name FROM images WHERE name = '%s';".format(name, ))
    return cur.fetchone() is not None


