# -*- coding: utf-8 -*-
#
# This file is part of Invenio
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
# along with Invenio; if not, write to the Free Software Foundation,
# Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

"""Test cds query parser."""

from __future__ import absolute_import

from invenio.testsuite import InvenioTestCase, make_test_suite, run_test_suite


class TestCDSQueryParser(InvenioTestCase):

    """Test CDS query parser."""

    def test_if_matches_query_with_normal_dict(self):
        """Test if contains query with normal dict."""
        from invenio_search.api import Query

        test_record = {
            "927__a": "CERN-ARCH-KJ-140"
        }
        query = Query('927__a:"CERN-ARCH-KJ-140"')
        self.assertTrue(
            query.match(
                test_record
            )
        )

        query = Query('927.a:"Jarvis"')
        self.assertFalse(
            query.match(
                test_record
            )
        )

    def test_if_matches_query_with_smart_dict(self):
        """Test if contains query with smart dict."""
        from invenio.utils.datastructures import SmartDict
        from invenio_search.api import Query

        test_record = {
            "927.a": "CERN-ARCH-KJ-140"
        }
        query = Query('927.a:"CERN-ARCH-KJ-140"')
        self.assertTrue(
            query.match(
                SmartDict(test_record)
            )
        )

        query = Query('927.a:"Jarvis"')
        self.assertFalse(
            query.match(
                SmartDict(test_record)
            )
        )

TEST_SUITE = make_test_suite(TestCDSQueryParser)

if __name__ == "__main__":
    run_test_suite(TEST_SUITE)
