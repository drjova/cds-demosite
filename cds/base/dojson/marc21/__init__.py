# -*- coding: utf-8 -*-
#
# This file is part of CERN Document Server.
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
# 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

from invenio_search.api import Query

from .registry import translations as _translations

def convert_cdsmarcxml(source):
    """Convert CDS to JSON."""
    from dojson.contrib.marc21.utils import create_record, split_blob

    for data in split_blob(source.read()):
        record = create_record(data)
        yield query_matcher(record).do(record)


def query_matcher(record):
    """Record query matcher.

    :param record: :func:`dojson.contrib.marc21.utils.create_record` object.
    """
    from cds.base.dojson.marc21.translations.default import (
      translation as marc21_default_translation
    )

    for name, translation in _translations.iteritems():
        translation_query = translation.__query__
        if translation_query:
            query = Query(translation_query)
            if query.match(record):
                return translation
                break
    else:
        return marc21_default_translation
