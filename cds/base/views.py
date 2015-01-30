# -*- coding: utf-8 -*-
##
## This file is part of CDS.
## Copyright (C) 2013, 2014, 2015 CERN.
##
## CDS is free software; you can redistribute it and/or
## modify it under the terms of the GNU General Public License as
## published by the Free Software Foundation; either version 2 of the
## License, or (at your option) any later version.
##
## CDS is distributed in the hope that it will be useful, but
## WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
## General Public License for more details.
##
## You should have received a copy of the GNU General Public License
## along with CDS; if not, write to the Free Software Foundation, Inc.,
## 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

"""CDS Demosite interface."""

from flask import Blueprint, jsonify
from flask.ext.login import current_user
from jinja2 import Template

from invenio.modules.accounts.models import User
from invenio.modules.records.api import Record
from invenio.modules.search.models import Collection

blueprint = Blueprint(
    'cds', __name__, url_prefix='/', template_folder='templates',
    static_folder='static'
)


# CDS useful template filters
# ===========================
@blueprint.app_template_filter('wrap_with_link')
def wrap_with_link(value, url="#"):
    """Wrap a text with html link."""
    template = Template(
        "<a href='{{ url }}'>{{ value }}</a>"
    )
    data = dict(value=value, url=url)
    return template.render(**data)


# NOTE: Everything underneath this line is a dummy test.
def _get_user_tags():
    """Get the user tags."""
    template = Template(
        "<h3>Your tags</h3>"
        "<div style='padding:10px 25px'>"
        "{% for tag in tags %}"
        "<a href='/youraccounts/tags/{{ tag }}' "
        "{% set rand = range(12,45) | random %}"
        "style='font-size: {{ rand }}px;'> {{ tag }}</a>"
        "{% endfor %}"
        "</div>"
    )
    if current_user.is_authenticated():
        user = User.query.get(current_user.get_id())
        user_tags = user.tags_query.limit(10)
        tags = [tag.name for tag in user_tags]
    else:
        tags = ["tags_{0}".format(i) for i in range(1, 10)]
    return template.render(dict(tags=tags))


def _get_records_from_collection(collection="Published Articles", limit=5):
    """Record from collection."""
    collection = Collection.query.filter(Collection.name == collection).first()
    record_ids = collection.reclist[0:limit]
    records = []
    for record_id in record_ids:
        records.append(Record.get_record(record_id))
    template = Template(
        "{% if records|length > 1 %}"
        "<h3><a href='{{ url }}'>{{ title }}</a></h3>"
        "<ul>"
        "{% for record in records %}"
        "<li><a href='/record/{{ record._id }}'>"
        "{{ record.get('title.title') }}</a></li>"
        "{% endfor %}"
        "</ul>"
        "{% else %}"
        "<h3><a href='{{ url }}'>{{ title }}</a></h3>"
        "<img src='{{ records[0].get('url')[0]['url']  }}' alt='' "
        "style='margin:0 1em 1em 0; width:50%' align='left'>"
        "<p>test</p>"
        "{% endif %}"
    )
    return template.render(dict(records=records, title=collection.name,
                                url="/collection/{0}".format(collection.name)))


def _get_user_searches():
    """Get user searches."""


def _get_latest_photo():
    """Get latest photo."""
    template = Template(
        "<div style=\"height:150px\"></div><div class=\"white-wrap wrap\"><p>"
        "<a href=\"#\">{{title}}</a></p></div>"
    )
    photos = Collection.query.filter(Collection.name == "Photos").first()

    record_id = photos.reclist[0]

    record = Record.get_record(record_id)

    image_url = [image.get('url') for image in record.get('url')
                 if image.get('subformat') == 'icon-640'][0]
    return image_url, template.render(
        dict(title=record.get('title', {}).get('title')))


def _build_object(body, box="Box", title="Header",
                  href="/youraccount/display", label="see more",
                  bg_image=None, wrap=False):
    data = dict(
        box=box,
        data=dict(
            header=dict(
                title=title,
                href=href
            ),
            wrap=wrap,
            backgroundImage=bg_image,
            body=body,
            footer=dict(
                label=label
            )
        ),
    )
    return data


@blueprint.route('test')
def build_personal():
    """Build personal collections."""
    results = []
    tags = _get_user_tags()
    results.append(
        _build_object(
            _get_user_tags(), title="Your tags", href="/youraccount/yourtags"
        )
    )
    bg_image, image = _get_latest_photo()
    results.append(
        _build_object(
            image, title="Photos", href="/collection/Photos", box="PictureBox",
            bg_image=bg_image
        )
    )
    results.append(
        _build_object(
            _get_records_from_collection()
        )
    )
    results.append(
        _build_object(
            _get_records_from_collection(collection="LHC")
        )
    )
    results.append(
        _build_object(
            _get_records_from_collection(collection="Photos", limit=1)
        )
    )
    response = jsonify(items=results)
    return response
