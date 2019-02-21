#!/bin/bash -ex
service gunicorn start
sleep 1
service nginx start
