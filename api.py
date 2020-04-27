import requests
import re
import json

def search(keywords,  max_results=None):
    query = keywords.encode('utf-8')
    keyword_query = str(query)

    url = 'https://duckduckgo.com/'
    params = {
    	'q': keyword_query
    };

    #   First make a request to above URL, and parse out the 'vqd'
    #   This is a special token, which should be used in the subsequent request
    res = requests.post(url, data=params)
    searchObj = re.search(r"vqd=\'([\d-]+)\'", res.text, re.M|re.I)


    headers = {
    'dnt': '1',
    'crossDomain': 'true',
    #'accept-encoding': 'gzip, deflate, sdch, br',
    'x-requested-with': 'XMLHttpRequest',
    'accept-language': 'en-GB,en-US;q=0.8,en;q=0.6,ms;q=0.4',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
    'accept': 'application/json', # text/javascript, */*; q=0.01',
    'referer': 'https://duckduckgo.com/',
    'authority': 'duckduckgo.com',
    "Access-Control-Allow-Credentials": "true"


    }

    params = (
    ('l', 'wt-wt'),
    ('o', 'json'),
    ('kp', '1'),
    ('q', keyword_query),
    ('vqd', searchObj.group(1)),
    ('iax', 'images'),
    ('ia', 'images'),
    ('iaf','type:photo-photo,size:imagesize-medium'),
    ('f', ',,,'),
    ('p', '2')
    )

    requestUrl = url + "i.js";
    res = requests.get(requestUrl, headers=headers, params=params);

    data = json.loads(res.text);
    imageList = getJson(data["results"]);
    return imageList


def getJson(objs):
    imageList = []
    for obj in objs[:40]:
        if obj["image"].endswith(".png") or obj["image"].endswith(".jpg") or obj["image"].endswith(".jpeg"):
            imageList.append(obj["image"])


    return imageList

