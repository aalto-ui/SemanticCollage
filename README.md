# SemanticCollage: Enriching Digital Mood Board Design with Semantic Labels

In the [SemanticCollage project](http://dx.doi.org/10.1145/3357236.3395494) (released July 6th 2020) we developed a digital mood board tool that attaches semantic labels to images by applying a state-of-the-art semantic labeling algorithm.
It helps designers to 1) translate vague, visual ideas into search terms; 
2) make better sense of and communicate their designs; while 
3) not disrupting their creative flow.


## Overview of the System:
<img src="https://github.com/aalto-ui/SemanticCollage/blob/master/figure/hero.jpg"/>
SemanticCollage is a semantically enriched digital mood board tool for image collection and interpretation. Blue tools support image and text manipulation; Red tools provide semantic labels.



## Getting started:
```bash
1) setup Postgres DB -- db name: semanticcollage
2) create tables using the statements in the DB folder
3) make sure the user 'research' has read/write privilages
(GRANT ALL PRIVILEGES ON DATABASE "semanticcollage" to research;)
4) install requirements: see requirements.tex
5) add a folder 'images' in the static folder
```

## Usage:
```bash
1) Navigate to the folder.
2) start the system: python main.py
3) connect to: http://localhost:8080
```

## Python version
2.7

## Citation
```bash
@inproceedings{SemanticCollage,
  title={SemanticCollage: Enriching Digital Mood Board Design with Semantic Labels},
  author={Koch, Janin and Taffin, Nicolas and Lucero, Andr{\'e}s and Mackay, Wendy},
  booktitle={Proceedings of the Designing Interactive Systems Conference 2020 (DIS '20)},
  year={2020},
  organization={ACM}
}
```



## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT), see the [LICENSE.txt](./LICENSE.txt) file for details.

Copyright © 2020 [User Interfaces group](https://userinterfaces.aalto.fi/), [Aalto University](https://www.aalto.fi/), Finland
