FROM python:3.12.9-slim-bookworm
ENV PYTHONUNBUFFERED 1
ENV PYTHONFAULTHANDLER=1

COPY . /app
WORKDIR /app

RUN apt-get update && \
	DEBIAN_FRONTEND=noninteractive apt-get -y install \
	build-essential \
	python3-dev \
	libxml2-dev \
	libxslt-dev \
	curl \
	gzip \
	sqlite3 && \
	apt-get clean

# NOTE: the below compiler flags are specifically targeted at the https://pypi.org/project/annoy/ library
# which is a dependency used for testing cosine similarity. The annoy library is optimized with C/C++
# and we've run into compatibility issues when building the extension in CI/CD (CodeBuild) and then
# deploying (Fargate). The problem is that the build CPU includes AVX extensions (instructions) that
# are not present in Fargate, which ultimately results in a "Fatal Python error: Illegal instruction".
# To that end, we are disabling the AVX1/AVX2 and AVX512 extensions for x86_64 architectures. These
# compiler flags are not supported for `arm64` architectures (e.g. M1 Macs).
RUN pip install --upgrade pip && \
    if [ "$(uname -m)" = "x86_64" ]; then \
        CFLAGS="-mno-avx -mno-avx512f" CXXFLAGS="-mno-avx -mno-avx512f" \
        pip install --no-cache-dir -r requirements.txt; \
    else \
        pip install --no-cache-dir -r requirements.txt; \
    fi

RUN ./manage.py migrate \
    && ./manage.py import_clancy_sqldump

RUN ./manage.py build_annoy_forest

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 CMD [ "curl -f http://127.0.0.1:8000/healthcheck" ]
ENTRYPOINT ["/app/docker-entrypoint.sh"]
