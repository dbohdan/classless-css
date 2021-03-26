#! /usr/bin/env tclsh
# Generate the screenshot and its thumbnail for a framework.  Print the
# Markdown to add to README.md.  To install the dependencies on Debian/Ubuntu:
# $ sudo apt install imagemagick optipng tcl tcllib wkhtmltopdf

package require fileutil

proc [info script] {name css github demo} {
    set src screenshot-page.html
    set dest temp.html

    set filename [slugify $name].png

    fileutil::writeFile $dest [regsub %CSS_HERE% [fileutil::cat $src] $css]
    run wkhtmltoimage $dest screenshot/$filename
    run convert \
        -resize 25% \
        -adaptive-sharpen 10 \
        screenshot/$filename \
        thumbnail/$filename
    run optipng -o5 -strip all screenshot/$filename thumbnail/$filename

    puts ------\n[markup $name $github $demo $filename]
}

proc slugify text {
    string trim [regsub -all {[^[:alnum:]]+} [string tolower $text] -] -
}

proc run args {
    exec {*}$args >@ stdout 2>@ stderr
}

proc markup {name github demo filename} {
    subst -nocommands {### $name

* [Repository](https://github.com/$github) ![GitHub stars](https://img.shields.io/github/stars/$github?style=flat-square) ![GitHub contributors](https://img.shields.io/github/contributors-anon/$github?style=flat-square) ![Last commit](https://img.shields.io/github/last-commit/$github?style=flat-square) ![GitHub open issues](https://img.shields.io/github/issues-raw/$github?style=flat-square) ![GitHub closed issues](https://img.shields.io/github/issues-closed-raw/$github?style=flat-square)
* [Demo]($demo)

[![$filename](thumbnail/$filename)](screenshot/$filename)}
}

[info script] {*}$argv
