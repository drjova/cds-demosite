# -*- coding: utf-8 -*-
#
# This file is part of CERN Document Server.
# Copyright (C) 2016 CERN.
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

"""Video JSON schema."""

from __future__ import absolute_import

from cds.modules.records.serializers.schemas.json.common import \
    StrictKeysSchema, ContributorSchema, KeywordsSchema, DescriptionSchema, \
    BucketSchema, OaiSchema, CreatorSchema, DescriptionTranslationSchema, \
    DepositSchema, TitleTranslationSchema, TitleSchema, AccessSchema
from marshmallow import fields


class VideoDepositSchema(DepositSchema):
    """Project Deposit Schema."""

    state = fields.Raw()


class CopyrightSchema(StrictKeysSchema):
    """Copyright schema."""

    holder = fields.Str()
    url = fields.Str()
    year = fields.Str()


class VideoFileSchema(StrictKeysSchema):
    """Video file schema."""

    bitrate = fields.Str()
    bucket = fields.Str()
    category = fields.Str()
    checksum = fields.Str()
    height = fields.Str()
    key = fields.Str()
    previewer = fields.Str()
    quality = fields.Str()
    size = fields.Integer()
    thumbnail = fields.Str()
    type = fields.Str()
    version_id = fields.Str()
    width = fields.Str()


class VideoSchema(StrictKeysSchema):
    """Video schema."""

    _access = fields.Nested(AccessSchema)
    _buckets = fields.Nested(BucketSchema)
    _deposit = fields.Nested(VideoDepositSchema)
    _oai = fields.Nested(OaiSchema)
    _project_id = fields.Str()
    contributors = fields.Nested(ContributorSchema, many=True)
    copyright = fields.Nested(CopyrightSchema)
    creator = fields.Nested(CreatorSchema)
    date = fields.Str()
    description = fields.Nested(DescriptionSchema)
    description_translations = fields.Nested(DescriptionTranslationSchema,
                                             many=True)
    keywords = fields.Nested(KeywordsSchema, many=True)
    license = fields.Str()
    recid = fields.Number()
    schema = fields.Str(attribute="$schema")
    title = fields.Nested(TitleSchema)
    title_translations = fields.Nested(TitleTranslationSchema, many=True)
