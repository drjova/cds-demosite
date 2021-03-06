# -*- coding: utf-8 -*-
#
# This file is part of CERN Document Server.
# Copyright (C) 2016 CERN.
#
# CERN Document Server is free software; you can redistribute it
# and/or modify it under the terms of the GNU General Public License as
# published by the Free Software Foundation; either version 2 of the
# License, or (at your option) any later version.
#
# CERN Document Server is distributed in the hope that it will be
# useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with CERN Document Server; if not, write to the
# Free Software Foundation, Inc., 59 Temple Place, Suite 330, Boston,
# MA 02111-1307, USA.
#
# In applying this license, CERN does not
# waive the privileges and immunities granted to it by virtue of its status
# as an Intergovernmental Organization or submit itself to any jurisdiction.

"""Test Deposit Project REST."""

from __future__ import absolute_import, print_function

import json

from cds.modules.deposit.api import project_resolver, video_resolver
from flask import url_for
from invenio_accounts.testutils import login_user_via_session
from invenio_accounts.models import User


def test_simple_workflow(app, db, es, users, location, cds_jsonresolver,
                         project_metadata, json_headers, deposit_rest,
                         data_file_1, data_file_2):
    """Test project simple workflow."""
    def check_connection(videos, project):
        """check project <---> video connection."""
        assert all({"$reference": video.ref} in project['videos']
                   for video in videos)
        assert len(videos) == len(project['videos'])

    project_schema = ('https://cdslabs.cern.ch/schemas/'
                      'deposits/records/project-v1.0.0.json')
    video_schema = ('https://cdslabs.cern.ch/schemas/'
                    'deposits/records/video-v1.0.0.json')

    with app.test_client() as client:
        login_user_via_session(client, email=User.query.get(users[0]).email)

        # [[ CREATE NEW PROJECT ]]
        res = client.post(
            url_for('invenio_deposit_rest.project_list'),
            data=json.dumps(project_metadata), headers=json_headers)

        # check returned value
        assert res.status_code == 201
        project_dict = json.loads(res.data.decode('utf-8'))
        assert project_dict['metadata']['videos'] == []
        assert project_dict['metadata']['title']['title'] == 'my project'
        assert project_dict['links']['bucket'].startswith(
            'http://localhost/files/')
        assert all(link.startswith('http://localhost/deposits/project')
                   for (key, link) in project_dict['links'].items()
                   if key not in ['html', 'bucket'])
        # check database
        project_id = project_dict['metadata']['_deposit']['id']
        project = project_resolver(project_id)
        assert project['$schema'] == project_schema

        # [[ ADD A NEW EMPTY VIDEO_1 ]]
        res = client.post(
            url_for('invenio_deposit_rest.video_list'),
            data=json.dumps({
                '_project_id': project_dict['metadata']['_deposit']['id'],
            }), headers=json_headers)

        # check returned value
        assert res.status_code == 201
        video_1_dict = json.loads(res.data.decode('utf-8'))
        assert video_1_dict['metadata']['_project_id'] == project_id
        assert all(link.startswith('http://localhost/deposits/video')
                   for (key, link) in video_1_dict['links'].items()
                   if key not in ['html', 'bucket'])
        # check database: connection project <---> videos
        video_ids = [
            video_1_dict['metadata']['_deposit']['id']
        ]
        [video_1] = video_resolver(video_ids)
        check_connection(
            [video_1],
            project_resolver(project_dict['metadata']['_deposit']['id']))
        assert video_1['$schema'] == video_schema

        # [[ GET THE VIDEO 1 ]]
        res = client.get(
            video_1_dict['links']['self'],
            headers=json_headers)

        # check returned value
        assert res.status_code == 200
        video_1_dict = json.loads(res.data.decode('utf-8'))
        assert video_1_dict['metadata']['_files'] == []

        # [[ ADD A NEW EMPTY VIDEO_2 ]]
        res = client.post(
            url_for('invenio_deposit_rest.video_list'),
            data=json.dumps({
                '_project_id': project_dict['metadata']['_deposit']['id'],
            }), headers=json_headers)

        # check returned value
        assert res.status_code == 201
        video_2_dict = json.loads(res.data.decode('utf-8'))
        assert video_2_dict['metadata']['_project_id'] == project_id
        assert all(link.startswith('http://localhost/deposits/video')
                   for (key, link) in video_2_dict['links'].items()
                   if key not in ['html', 'bucket'])
        # check database: connection project <---> videos
        video_ids = [
            video_1_dict['metadata']['_deposit']['id'],
            video_2_dict['metadata']['_deposit']['id']
        ]
        [video_1, video_2] = video_resolver(video_ids)
        check_connection(
            [video_1, video_2],
            project_resolver(project_dict['metadata']['_deposit']['id']))
        assert video_2['$schema'] == video_schema

        # [[ ADD A FILE INSIDE VIDEO_1 ]]
        res = client.post(
            url_for('invenio_deposit_rest.video_files',
                    pid_value=video_1_dict['metadata']['_deposit']['id']),
            data=data_file_1, content_type='multipart/form-data')

        # check returned value
        assert res.status_code == 201
        file_1 = json.loads(res.data.decode('utf-8'))
        assert file_1['checksum'] == 'md5:eb88ae1e3666e6fe96a33ea72aab630e'
        assert file_1['filesize'] == 24
        assert file_1['filename'] == 'test.json'
        assert file_1['id']
        # check database: connection project <---> videos
        [video_1] = video_resolver(
            [video_1_dict['metadata']['_deposit']['id']])
        assert video_1['_files'][0]['key'] == 'test.json'
        video_ids = [
            video_1_dict['metadata']['_deposit']['id'],
            video_2_dict['metadata']['_deposit']['id']
        ]
        check_connection(
            video_resolver(video_ids),
            project_resolver(project_dict['metadata']['_deposit']['id']))

        # [[ GET THE VIDEO 1 ]]
        res = client.get(video_1_dict['links']['self'], headers=json_headers)

        # check video metadata
        assert res.status_code == 200
        video_1_dict = json.loads(res.data.decode('utf-8'))
        assert len(video_1_dict['metadata']['_files']) == 1
        myfile = video_1_dict['metadata']['_files'][0]
        assert myfile['links']['self'].startswith('/api/files/')
        assert myfile['checksum'] == 'md5:eb88ae1e3666e6fe96a33ea72aab630e'
        assert myfile['completed'] is True
        assert 'version_id' in myfile
        assert myfile['key'] == 'test.json'
        assert myfile['progress'] == 100
        assert myfile['size'] == 24

        # [[ PUBLISH VIDEO_1 ]]
        # Not need to send _files
        del video_1_dict['metadata']['_files']
        res = client.post(
            url_for('invenio_deposit_rest.video_actions',
                    pid_value=video_1['_deposit']['id'], action='publish'),
            headers=json_headers)

        # check returned value
        assert res.status_code == 202
        video_1_dict = json.loads(res.data.decode('utf-8'))
        assert video_1_dict['metadata']['_deposit']['status'] == 'published'
        assert video_1_dict['metadata']['recid'] == 1
        assert video_1_dict['metadata']['_project_id'] == project_id
        # check database: connection project <---> videos
        video_ids = [
            video_1_dict['metadata']['_deposit']['id'],
            video_2_dict['metadata']['_deposit']['id']
        ]
        check_connection(
            video_resolver(video_ids),
            project_resolver(project_dict['metadata']['_deposit']['id']))

        # [[ ADD A VIDEO INSIDE VIDEO_2 ]]
        res = client.post(
            url_for('invenio_deposit_rest.video_files',
                    pid_value=video_2_dict['metadata']['_deposit']['id']),
            data=data_file_2, content_type='multipart/form-data')

        # check returned value
        assert res.status_code == 201
        file_2 = json.loads(res.data.decode('utf-8'))
        assert file_2['checksum'] == 'md5:95405c14852500dcbb6dbfd9e27a3594'
        assert file_2['filesize'] == 26
        assert file_2['filename'] == 'test2.json'
        # check connection project <---> videos
        [video_2] = video_resolver(
            [video_2_dict['metadata']['_deposit']['id']])
        assert video_2['_files'][0]['key'] == 'test2.json'
        video_ids = [
            video_1_dict['metadata']['_deposit']['id'],
            video_2_dict['metadata']['_deposit']['id']
        ]
        check_connection(
            video_resolver(video_ids),
            project_resolver(project_dict['metadata']['_deposit']['id']))

        # [[ PUBLISH THE PROJECT ]]
        res = client.post(
            url_for('invenio_deposit_rest.project_actions',
                    pid_value=project['_deposit']['id'], action='publish'),
            headers=json_headers)

        # check returned value
        assert res.status_code == 202
        project_dict = json.loads(res.data.decode('utf-8'))
        assert project_dict['metadata']['_deposit']['status'] == 'published'
        assert project_dict['metadata']['recid'] == 3
        assert project_dict['metadata']['videos'][0] == {
            '$reference': '/record/1'}
        assert project_dict['metadata']['videos'][1] == {
            '$reference': '/record/2'}
        # check database: connection project <---> videos
        video_ids = [
            video_1_dict['metadata']['_deposit']['id'],
            video_2_dict['metadata']['_deposit']['id']
        ]
        check_connection(
            video_resolver(video_ids),
            project_resolver(project_dict['metadata']['_deposit']['id']))

        # [[ EDIT THE PROJECT ]]
        res = client.post(
            url_for('invenio_deposit_rest.project_actions',
                    pid_value=project_dict['metadata']['_deposit']['id'],
                    action='edit'),
            headers=json_headers)

        # check returned value
        assert res.status_code == 201
        project_dict = json.loads(res.data.decode('utf-8'))
        assert project_dict['metadata']['_deposit']['status'] == 'draft'
        # check database
        project = project_resolver(project_dict['metadata']['_deposit']['id'])
        assert project['_deposit']['status'] == 'draft'

        # [[ MODIFY PROJECT ]]
        project_dict['metadata']['title']['title'] = 'new project title'
        # Not need to send _files
        del project_dict['metadata']['_files']
        res = client.put(
            url_for('invenio_deposit_rest.project_item',
                    pid_value=project_dict['metadata']['_deposit']['id']),
            data=json.dumps(project_dict['metadata']),
            headers=json_headers)
        # check returned value
        assert res.status_code == 200
        project_dict = json.loads(res.data.decode('utf-8'))
        assert project_dict['metadata']['title']['title'] ==\
            'new project title'
        assert all(link.startswith('http://localhost/deposits/project')
                   for (key, link) in project_dict['links'].items()
                   if key not in ['html', 'bucket'])
        # check database
        project = project_resolver(project_dict['metadata']['_deposit']['id'])
        assert project['title']['title'] == 'new project title'

        # [[ DISCARD PROJECT ]]
        res = client.post(
            url_for('invenio_deposit_rest.project_actions',
                    pid_value=project_dict['metadata']['_deposit']['id'],
                    action='discard'),
            headers=json_headers)
        # check returned value
        assert res.status_code == 201
        project_dict = json.loads(res.data.decode('utf-8'))
        assert project_dict['metadata']['title']['title'] == 'my project'
        # check database
        project = project_resolver(project_dict['metadata']['_deposit']['id'])
        assert project['title']['title'] == 'my project'
