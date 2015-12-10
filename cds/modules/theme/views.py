# -*- coding: utf-8 -*-
#
# This file is part of Invenio.
# Copyright (C) 2015 CERN.
#
# Invenio is free software; you can redistribute it
# and/or modify it under the terms of the GNU General Public License as
# published by the Free Software Foundation; either version 2 of the
# License, or (at your option) any later version.
#
# Invenio is distributed in the hope that it will be
# useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Invenio; if not, write to the
# Free Software Foundation, Inc., 59 Temple Place, Suite 330, Boston,
# MA 02111-1307, USA.
#
# In applying this license, CERN does not
# waive the privileges and immunities granted to it by virtue of its status
# as an Intergovernmental Organization or submit itself to any jurisdiction.

"""CDS interface."""

from __future__ import absolute_import, print_function

from flask import Blueprint, jsonify, render_template, request

from invenio_search import Query, current_search_client


blueprint = Blueprint(
    'cds',
    __name__,
    template_folder='templates',
    static_folder='static'
)


@blueprint.route('/')
def home():
    """CDS Home page."""
    return render_template('cds_theme/home.html')


@blueprint.route('/search')
def search():
    """CDS Search page."""
    return render_template('cds_theme/search.html')


@blueprint.route('/elastic', methods=['GET', 'POST'])
@blueprint.route('/elastic/<index_name>', methods=['GET', 'POST'])
@blueprint.route('/elastic/<index_name>/_search', methods=['GET', 'POST'])
def elastic(index_name='cds'):
    """CDS Home page."""
    page = request.values.get('page', 1, type=int)
    size = request.values.get('size', 1, type=int)
    query = Query(request.values.get('q', ''))[(page-1)*size:page*size]
    response = current_search_client.search(
        index=index_name,
        doc_type=request.values.get('type', 'example'),
        body=query.body,
    )
    return jsonify(**response)
