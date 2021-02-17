#!/bin/bash

function rate-period() {
    YESTERDAY=$(date -d 'yesterday' +%e/%m/%Y)
    TODAY=$(date +%e/%m/%Y)

    curl -v "http://www.cbr.ru/scripts/XML_dynamic.asp?VAL_NM_RQ=R01235&date_req1=$1&date_req2=$TODAY" 2>/dev/null | \
    xmllint --format - | \
    awk -F'[<|>|"]' '
        /Record/{d=$3}
        /Value/{printf "%s;%s\n",d,$3}'
}
