# gunicorn configuration

bind = "0.0.0.0:8000"
workers = 3
# worker_tmp_dir = "/dev/shm" # https://docs.gunicorn.org/en/stable/faq.html#how-do-i-avoid-gunicorn-excessively-blocking-in-os-fchmod

# These log settings assume that gunicorn log config will be included in the django base.py logging configuration
accesslog = "-"
errorlog = "-"
access_log_format = (
    '{"request": "%(r)s", "http_status_code": "%(s)s", "http_request_url": "%(U)s", '
    '"http_query_string": "%(q)s", "http_verb": "%(m)s", "http_version": "%(H)s", '
    '"http_referer": "%(f)s", "x_forwarded_for": "%({x-forwarded-for}i)s", '
    '"remote_address": "%(h)s", "request_usec": "%(D)s", "request_sec": "%(L)s"}'
)
loglevel = "DEBUG"
enable_stdio_inheritance = True
capture_output = True
