import base64, pathlib
d = pathlib.Path(__file__).parent
gs = base64.b64encode(open('/Users/matthaioschristoforou/Projects/marketing-assets/fonts/general-sans/GeneralSans_Complete/Fonts/WEB/fonts/GeneralSans-Variable.woff2','rb').read()).decode()
(d/'index.html').write_text((d/'index.src.html').read_text().replace('__GS__', gs))
print('built', len((d/'index.html').read_text()))
