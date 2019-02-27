#!/bin/bash

METHOD=POST
URL=http://localhost:8000/api/parsetext?html=y
TEXT='"Все счастливые семьи похожи друг на друга, каждая несчастливая семья несчастлива по-своему."'

curl -i -H "Content-Type: application/json" -X $METHOD -d "$TEXT" $URL
