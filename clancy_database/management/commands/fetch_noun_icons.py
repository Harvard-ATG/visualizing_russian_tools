from django.core.management.base import BaseCommand, CommandParser

from typing import Any, Optional

import requests
from requests_oauthlib import OAuth1

import argparse
import csv
import os

NOUN_PROJECT_API_KEY = os.environ.get("NOUN_PROJECT_API_KEY")
NOUN_PROJECT_API_SECRET = os.environ.get("NOUN_PROJECT_API_SECRET")


AUTH = OAuth1(str(NOUN_PROJECT_API_KEY), str(NOUN_PROJECT_API_SECRET))


def get_icon(term: str) -> Optional[str]:
    endpoint = f"https://api.thenounproject.com/icon/{term}"
    try:
        print(f"Calling: {endpoint}")
        response = requests.get(endpoint, auth=AUTH)
        response.raise_for_status()
    except requests.exceptions.HTTPError:
        return None
    return response.json()["icon"]


class Command(BaseCommand):

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--input_file",
            required=True,
            type=argparse.FileType("r"),
            help="Clancy master spreadsheet as a csv"
        )
        parser.add_argument(
            "--output_file",
            required=True,
            type=str,
            help="The name of the output file."
        )
        parser.add_argument(
            "--level",
            required=True,
            type=str,
            help="The Clancy classification word level, i.e. 1E, 2I, 3A etc"
        )

    def handle(self, *args: Any, **options: Any) -> None:
        rows = csv.DictReader(options["input_file"])
        output_file_name = options["output_file"]
        output = []
        for row in rows:
            if row["POS"] == "noun" and row["Level"] == options["level"]:
                icon = get_icon(row["English"].split(',')[0])
                if icon and icon["license_description"] == "creative-commons-attribution":
                    d = {
                        "Russian": row['Russian'],
                        "English": row["English"],
                        "icon_url": icon["preview_url"],
                        "license_description": icon["license_description"],
                        "attribution": icon["attribution"]
                    }
                    output.append(d)
        keys = output[0].keys()
        with open(output_file_name, "w+", newline='') as output_file:
            dict_writer = csv.DictWriter(output_file, keys)
            dict_writer.writeheader()
            dict_writer.writerows(output)
        print(f"!!!{output_file_name} has {len(output)} icons!!!")
