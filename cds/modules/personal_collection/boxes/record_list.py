# -*- coding: utf-8 -*-
#
# This file is part of Invenio.
# Copyright (C) 2015 CERN.
#
# Invenio is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License as
# published by the Free Software Foundation; either version 2 of the
# License, or (at your option) any later version.
#
# Invenio is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Invenio; if not, write to the Free Software Foundation, Inc.,
# 59 Temple Place, Suite 330, Boston, MA 02D111-1307, USA.

"""Record list box."""

from flask import url_for
from six import add_metaclass

from invenio.modules.records.api import Record
from invenio.modules.search.api import Query

from .base import BoxBase


@add_metaclass(BoxBase)
class RecordListBox(object):

    """Build a box with the content of a search query."""

    __display_name__ = 'Search'

    __template__ = 'record_list'

    __boxname__ = 'record_list'

    limit = 5
    """Number of records to display in the box (max)."""

    def __init__(self, query, collection, title, **kwargs):
        """Create the box object together with the query.

        :param query: Search query to build the box,
            i.e. 'collection:CERN Published Articles' or 'author:Ellis'
        :param title: Name for the box
        :param kwargs

        """
        self.query = Query(query)
        self.title = title
        self._settings = kwargs
        self._settings['query'] = query
        self._settings['collection'] = collection
        self._settings['title'] = title

    def build(self):
        """Generate the content of the box."""
        recids = self.query.search(
            collection=self._settings['collection'])[:self.__class__.limit]
        res = dict(
            header={'title': self.title},
            items=[],
            footer={'label': 'Show more'},
            _settings=self._settings
        )
        for recid in recids:
            record = Record.get_record(recid)
            res['items'].append(
                {'title': record.get('title', {}).get('title', ''),
                 'link': url_for('record.metadata', recid=recid,
                                 _external=True, _scheme='https')}
            )
        return res

box = RecordListBox
