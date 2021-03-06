﻿angular
    .module('bit.services')

    .factory('importService', function () {
        var _service = {};

        _service.import = function (source, file, success, error) {
            if (!file) {
                error();
                return;
            }

            switch (source) {
                case 'local':
                    importLocal(file, success, error);
                    break;
                case 'lastpass':
                    importLastPass(file, success, error);
                    break;
                case 'safeincloudcsv':
                    importSafeInCloudCsv(file, success, error);
                    break;
                case 'safeincloudxml':
                    importSafeInCloudXml(file, success, error);
                    break;
                case 'keepassxml':
                    importKeePassXml(file, success, error);
                    break;
                case 'padlockcsv':
                    importPadlockCsv(file, success, error);
                    break;
                case '1password1pif':
                    import1Password1Pif(file, success, error);
                    break;
                case 'chromecsv':
                    importChromeCsv(file, success, error);
                    break;
                case 'firefoxpasswordexportercsvxml':
                    importFirefoxPasswordExporterCsvXml(file, success, error);
                    break;
                case 'upmcsv':
                    importUpmCsv(file, success, error);
                    break;
                case 'keepercsv':
                    importKeeperCsv(file, success, error);
                    break;
                case 'passworddragonxml':
                    importPasswordDragonXml(file, success, error);
                    break;
                case 'enpasscsv':
                    importEnpassCsv(file, success, error);
                    break;
                case 'pwsafexml':
                    importPasswordSafeXml(file, success, error);
                    break;
                case 'dashlanecsv':
                    importDashlaneCsv(file, success, error);
                    break;
                case 'stickypasswordxml':
                    importStickyPasswordXml(file, success, error);
                    break;
                case 'msecurecsv':
                    importmSecureCsv(file, success, error);
                    break;
                case 'truekeyjson':
                    importTrueKeyJson(file, success, error);
                    break;
                case 'clipperzhtml':
                    importClipperzHtml(file, success, error);
                    break;
                case 'avirajson':
                    importAviraJson(file, success, error);
                    break;
                case 'roboformhtml':
                    importRoboFormHtml(file, success, error);
                    break;
                case 'saferpasscsv':
                    importSaferPassCsv(file, success, error);
                    break;
                default:
                    error();
                    break;
            }
        };

        var _passwordFieldNames = [
            'password', 'pass word', 'passphrase', 'pass phrase',
            'pass', 'code', 'code word', 'codeword',
            'secret', 'secret word',
            'key', 'keyword', 'key word', 'keyphrase', 'key phrase',
            'form_pw', 'wppassword', 'pin', 'pwd', 'pw', 'pword', 'passwd',
            'p', 'serial', 'serial#', 'license key', 'reg #',

            // Non-English names
            'passwort'
        ];

        var _usernameFieldNames = [
            'user', 'name', 'user name', 'username', 'login name',
            'email', 'e-mail', 'id', 'userid', 'user id',
            'login', 'form_loginname', 'wpname', 'mail',
            'loginid', 'login id', 'log',
            'first name', 'last name', 'card#', 'account #',
            'member', 'member #',

            // Non-English names
            'nom', 'benutzername'
        ];

        var _notesFieldNames = [
            "note", "notes", "comment", "comments", "memo",
            "description", "free form", "freeform",
            "free text", "freetext", "free",

            // Non-English names
            "kommentar"
        ];

        var _uriFieldNames = [
            'url', 'hyper link', 'hyperlink', 'link',
            'host', 'hostname', 'host name', 'server', 'address',
            'hyper ref', 'href', 'web', 'website', 'web site', 'site',
            'web-site',

            // Non-English names
            'ort', 'adresse'
        ];

        function isField(fieldText, refFieldValues) {
            if (!fieldText || fieldText === '') {
                return false;
            }

            fieldText = fieldText.trim().toLowerCase();

            for (var i = 0; i < refFieldValues.length; i++) {
                if (fieldText === refFieldValues[i]) {
                    return true;
                }
            }

            return false;
        }

        function trimUri(uri) {
            if (uri.length > 1000) {
                return uri.substring(0, 1000);
            }

            return uri;
        }

        function parseCsvErrors(results) {
            if (results.errors && results.errors.length) {
                for (var i = 0; i < results.errors.length; i++) {
                    console.warn('Error parsing row ' + results.errors[i].row + ': ' + results.errors[i].message);
                }
            }
        }

        function importLocal(file, success, error) {
            Papa.parse(file, {
                header: true,
                encoding: 'UTF-8',
                complete: function (results) {
                    parseCsvErrors(results);

                    var folders = [],
                        sites = [],
                        folderRelationships = [];

                    angular.forEach(results.data, function (value, key) {
                        var folderIndex = folders.length,
                            siteIndex = sites.length,
                            hasFolder = value.folder && value.folder !== '',
                            addFolder = hasFolder;

                        if (hasFolder) {
                            for (var i = 0; i < folders.length; i++) {
                                if (folders[i].name === value.folder) {
                                    addFolder = false;
                                    folderIndex = i;
                                    break;
                                }
                            }
                        }

                        sites.push({
                            favorite: value.favorite !== null ? value.favorite : false,
                            uri: value.uri && value.uri !== '' ? trimUri(value.uri) : null,
                            username: value.username && value.username !== '' ? value.username : null,
                            password: value.password && value.password !== '' ? value.password : null,
                            notes: value.notes && value.notes !== '' ? value.notes : null,
                            name: value.name && value.name !== '' ? value.name : '--',
                        });

                        if (addFolder) {
                            folders.push({
                                name: value.folder
                            });
                        }

                        if (hasFolder) {
                            var relationship = {
                                key: siteIndex,
                                value: folderIndex
                            };
                            folderRelationships.push(relationship);
                        }
                    });

                    success(folders, sites, folderRelationships);
                }
            });
        }

        function importLastPass(file, success, error) {
            if (file.type === 'text/html') {
                var reader = new FileReader();
                reader.readAsText(file, 'utf-8');
                reader.onload = function (evt) {
                    var doc = $(evt.target.result);
                    var pre = doc.find('pre');
                    var csv, results;

                    if (pre.length === 1) {
                        csv = pre.text().trim();
                        results = Papa.parse(csv, {
                            header: true,
                            encoding: 'UTF-8'
                        });
                        parseData(results.data);
                    }
                    else {
                        var foundPre = false;
                        for (var i = 0; i < doc.length; i++) {
                            if (doc[i].tagName.toLowerCase() === 'pre') {
                                foundPre = true;
                                csv = doc[i].outerText.trim();
                                results = Papa.parse(csv, {
                                    header: true,
                                    encoding: 'UTF-8'
                                });
                                parseData(results.data);
                                break;
                            }
                        }

                        if (!foundPre) {
                            error();
                        }
                    }
                };

                reader.onerror = function (evt) {
                    error();
                };
            }
            else {
                Papa.parse(file, {
                    header: true,
                    encoding: 'UTF-8',
                    complete: function (results) {
                        parseCsvErrors(results);
                        parseData(results.data);
                    }
                });
            }

            function parseData(data) {
                var folders = [],
                    sites = [],
                    siteRelationships = [];

                angular.forEach(data, function (value, key) {
                    var folderIndex = folders.length,
                        siteIndex = sites.length,
                        hasFolder = value.grouping && value.grouping !== '' && value.grouping !== '(none)',
                        addFolder = hasFolder;

                    if (hasFolder) {
                        for (var i = 0; i < folders.length; i++) {
                            if (folders[i].name === value.grouping) {
                                addFolder = false;
                                folderIndex = i;
                                break;
                            }
                        }
                    }

                    sites.push({
                        favorite: value.fav === '1',
                        uri: value.url && value.url !== '' ? trimUri(value.url) : null,
                        username: value.username && value.username !== '' ? value.username : null,
                        password: value.password && value.password !== '' ? value.password : null,
                        notes: value.extra && value.extra !== '' ? value.extra : null,
                        name: value.name && value.name !== '' ? value.name : '--',
                    });

                    if (addFolder) {
                        folders.push({
                            name: value.grouping
                        });
                    }

                    if (hasFolder) {
                        var relationship = {
                            key: siteIndex,
                            value: folderIndex
                        };
                        siteRelationships.push(relationship);
                    }
                });

                success(folders, sites, siteRelationships);
            }
        }

        function importSafeInCloudCsv(file, success, error) {
            Papa.parse(file, {
                header: true,
                encoding: 'UTF-8',
                complete: function (results) {
                    parseCsvErrors(results);

                    var folders = [],
                        sites = [],
                        siteRelationships = [];

                    angular.forEach(results.data, function (value, key) {
                        sites.push({
                            favorite: false,
                            uri: value.URL && value.URL !== '' ? trimUri(value.URL) : null,
                            username: value.Login && value.Login !== '' ? value.Login : null,
                            password: value.Password && value.Password !== '' ? value.Password : null,
                            notes: value.Notes && value.Notes !== '' ? value.Notes : null,
                            name: value.Title && value.Title !== '' ? value.Title : '--',
                        });
                    });

                    success(folders, sites, siteRelationships);
                }
            });
        }

        function importSafeInCloudXml(file, success, error) {
            var folders = [],
                sites = [],
                siteRelationships = [],
                foldersIndex = [];

            var i = 0,
                j = 0;

            var reader = new FileReader();
            reader.readAsText(file, 'utf-8');
            reader.onload = function (evt) {
                var xmlDoc = $.parseXML(evt.target.result),
                    xml = $(xmlDoc);

                var db = xml.find('database');
                if (db.length) {
                    var labels = db.find('> label');
                    if (labels.length) {
                        for (i = 0; i < labels.length; i++) {
                            var label = $(labels[i]);
                            foldersIndex[label.attr('id')] = folders.length;
                            folders.push({
                                name: label.attr('name')
                            });
                        }
                    }

                    var cards = db.find('> card');
                    if (cards.length) {
                        for (i = 0; i < cards.length; i++) {
                            var card = $(cards[i]);
                            if (card.attr('template') === 'true') {
                                continue;
                            }

                            var site = {
                                favorite: false,
                                uri: null,
                                username: null,
                                password: null,
                                notes: null,
                                name: card.attr('title'),
                            };

                            var fields = card.find('> field');
                            for (j = 0; j < fields.length; j++) {
                                var field = $(fields[j]);

                                var text = field.text();
                                var type = field.attr('type');

                                if (text && text !== '') {
                                    if (type === 'login') {
                                        site.username = text;
                                    }
                                    else if (type === 'password') {
                                        site.password = text;
                                    }
                                    else if (type === 'notes') {
                                        site.notes = text;
                                    }
                                    else if (type === 'website') {
                                        site.uri = trimUri(text);
                                    }
                                }
                            }

                            sites.push(site);

                            labels = card.find('> label_id');
                            if (labels.length) {
                                var labelId = $(labels[0]).text();
                                var folderIndex = foldersIndex[labelId];
                                if (labelId !== null && labelId !== '' && folderIndex !== null) {
                                    siteRelationships.push({
                                        key: sites.length - 1,
                                        value: folderIndex
                                    });
                                }
                            }
                        }
                    }

                    success(folders, sites, siteRelationships);
                }
                else {
                    error();
                }
            };

            reader.onerror = function (evt) {
                error();
            };
        }

        function importPadlockCsv(file, success, error) {
            Papa.parse(file, {
                encoding: 'UTF-8',
                complete: function (results) {
                    parseCsvErrors(results);

                    var folders = [],
                        sites = [],
                        folderRelationships = [];

                    var customFieldHeaders = [];

                    // CSV index ref: 0 = name, 1 = category, 2 = username, 3 = password, 4+ = custom fields

                    var i = 0,
                        j = 0;

                    for (i = 0; i < results.data.length; i++) {
                        var value = results.data[i];
                        if (i === 0) {
                            // header row
                            for (j = 4; j < value.length; j++) {
                                customFieldHeaders.push(value[j]);
                            }

                            continue;
                        }

                        var folderIndex = folders.length,
                            siteIndex = sites.length,
                            hasFolder = value[1] && value[1] !== '',
                            addFolder = hasFolder;

                        if (hasFolder) {
                            for (j = 0; j < folders.length; j++) {
                                if (folders[j].name === value[1]) {
                                    addFolder = false;
                                    folderIndex = j;
                                    break;
                                }
                            }
                        }

                        var site = {
                            favorite: false,
                            uri: null,
                            username: value[2] && value[2] !== '' ? value[2] : null,
                            password: value[3] && value[3] !== '' ? value[3] : null,
                            notes: null,
                            name: value[0] && value[0] !== '' ? value[0] : '--',
                        };

                        if (customFieldHeaders.length) {
                            for (j = 4; j < value.length; j++) {
                                var cf = value[j];
                                if (!cf || cf === '') {
                                    continue;
                                }

                                var cfHeader = customFieldHeaders[j - 4];
                                if (cfHeader.toLowerCase() === 'url' || cfHeader.toLowerCase() === 'uri') {
                                    site.uri = trimUri(cf);
                                }
                                else {
                                    if (site.notes === null) {
                                        site.notes = '';
                                    }

                                    site.notes += cfHeader + ': ' + cf + '\n';
                                }
                            }
                        }

                        sites.push(site);

                        if (addFolder) {
                            folders.push({
                                name: value[1]
                            });
                        }

                        if (hasFolder) {
                            folderRelationships.push({
                                key: siteIndex,
                                value: folderIndex
                            });
                        }
                    }

                    success(folders, sites, folderRelationships);
                }
            });
        }

        function importKeePassXml(file, success, error) {
            var folders = [],
                sites = [],
                siteRelationships = [];

            var reader = new FileReader();
            reader.readAsText(file, 'utf-8');
            reader.onload = function (evt) {
                var xmlDoc = $.parseXML(evt.target.result),
                    xml = $(xmlDoc);

                var root = xml.find('Root');
                if (root.length) {
                    var group = root.find('> Group');
                    if (group.length) {
                        traverse($(group[0]), true, '');
                        success(folders, sites, siteRelationships);
                    }
                }
                else {
                    error();
                }
            };

            reader.onerror = function (evt) {
                error();
            };

            function traverse(node, isRootNode, groupNamePrefix) {
                var nodeEntries = [];
                var folderIndex = folders.length;
                var groupName = groupNamePrefix;

                if (!isRootNode) {
                    if (groupName !== '') {
                        groupName += ' > ';
                    }
                    groupName += node.find('> Name').text();
                    folders.push({
                        name: groupName
                    });
                }

                var entries = node.find('> Entry');
                if (entries.length) {
                    for (var i = 0; i < entries.length; i++) {
                        var entry = $(entries[i]);
                        var siteIndex = sites.length;
                        var site = {
                            favorite: false,
                            uri: null,
                            username: null,
                            password: null,
                            notes: null,
                            name: null
                        };

                        var entryStrings = entry.find('> String');
                        for (var j = 0; j < entryStrings.length; j++) {
                            var entryString = $(entryStrings[j]);

                            var key = entryString.find('> Key').text();
                            var value = entryString.find('> Value').text();
                            if (value === '') {
                                continue;
                            }

                            switch (key) {
                                case 'URL':
                                    site.uri = trimUri(value);
                                    break;
                                case 'UserName':
                                    site.username = value;
                                    break;
                                case 'Password':
                                    site.password = value;
                                    break;
                                case 'Title':
                                    site.name = value;
                                    break;
                                case 'Notes':
                                    site.notes = site.notes === null ? value + '\n' : site.notes + value + '\n';
                                    break;
                                default:
                                    // other custom fields
                                    site.notes = site.notes === null ? key + ': ' + value + '\n'
                                        : site.notes + key + ': ' + value + '\n';
                                    break;
                            }
                        }

                        if (site.name === null) {
                            site.name = '--';
                        }

                        sites.push(site);

                        if (!isRootNode) {
                            siteRelationships.push({
                                key: siteIndex,
                                value: folderIndex
                            });
                        }
                    }
                }

                var groups = node.find('> Group');
                if (groups.length) {
                    for (var k = 0; k < groups.length; k++) {
                        traverse($(groups[k]), false, groupName);
                    }
                }
            }
        }

        function import1Password1Pif(file, success, error) {
            var folders = [],
                sites = [],
                siteRelationships = [];

            var i = 0,
                j = 0;

            var reader = new FileReader();
            reader.readAsText(file, 'utf-8');
            reader.onload = function (evt) {
                var fileContent = evt.target.result;
                var fileLines = fileContent.split(/(?:\r\n|\r|\n)/);

                for (i = 0; i < fileLines.length; i++) {
                    var line = fileLines[i];
                    if (!line.length || line[0] !== '{') {
                        continue;
                    }

                    var item = JSON.parse(line);
                    if (item.typeName !== 'webforms.WebForm') {
                        continue;
                    }

                    var site = {
                        favorite: item.openContents && item.openContents.faveIndex ? true : false,
                        uri: item.location && item.location !== '' ? trimUri(item.location) : null,
                        username: null,
                        password: null,
                        notes: null,
                        name: item.title && item.title !== '' ? item.title : '--',
                    };

                    if (item.secureContents) {
                        if (item.secureContents.notesPlain && item.secureContents.notesPlain !== '') {
                            site.notes = item.secureContents.notesPlain;
                        }

                        if (item.secureContents.fields) {
                            for (j = 0; j < item.secureContents.fields.length; j++) {
                                var field = item.secureContents.fields[j];
                                if (field.designation === 'username') {
                                    site.username = field.value;
                                }
                                else if (field.designation === 'password') {
                                    site.password = field.value;
                                }
                                else {
                                    if (site.notes === null) {
                                        site.notes = '';
                                    }
                                    else {
                                        site.notes += '\n';
                                    }

                                    site.notes += (field.name + ': ' + field.value + '\n');
                                }
                            }
                        }
                    }

                    sites.push(site);
                }

                success(folders, sites, siteRelationships);
            };

            reader.onerror = function (evt) {
                error();
            };
        }

        function importChromeCsv(file, success, error) {
            Papa.parse(file, {
                header: true,
                encoding: 'UTF-8',
                complete: function (results) {
                    parseCsvErrors(results);

                    var folders = [],
                        sites = [],
                        siteRelationships = [];

                    angular.forEach(results.data, function (value, key) {
                        sites.push({
                            favorite: false,
                            uri: value.url && value.url !== '' ? trimUri(value.url) : null,
                            username: value.username && value.username !== '' ? value.username : null,
                            password: value.password && value.password !== '' ? value.password : null,
                            notes: null,
                            name: value.name && value.name !== '' ? value.name : '--',
                        });
                    });

                    success(folders, sites, siteRelationships);
                }
            });
        }

        function importFirefoxPasswordExporterCsvXml(file, success, error) {
            var folders = [],
                sites = [],
                siteRelationships = [];

            function getNameFromHost(host) {
                var name = '--';
                try {
                    if (host && host !== '') {
                        var parser = document.createElement('a');
                        parser.href = host;
                        if (parser.hostname) {
                            name = parser.hostname;
                        }
                    }
                }
                catch (e) {
                    // do nothing
                }

                return name;
            }

            if (file.type === 'text/xml') {
                var reader = new FileReader();
                reader.readAsText(file, 'utf-8');
                reader.onload = function (evt) {
                    var xmlDoc = $.parseXML(evt.target.result),
                        xml = $(xmlDoc);

                    var entries = xml.find('entry');
                    for (var i = 0; i < entries.length; i++) {
                        var entry = $(entries[i]);
                        if (!entry) {
                            continue;
                        }

                        var host = entry.attr('host'),
                            user = entry.attr('user'),
                            password = entry.attr('password');

                        sites.push({
                            favorite: false,
                            uri: host && host !== '' ? trimUri(host) : null,
                            username: user && user !== '' ? user : null,
                            password: password && password !== '' ? password : null,
                            notes: null,
                            name: getNameFromHost(host),
                        });
                    }

                    success(folders, sites, siteRelationships);
                };

                reader.onerror = function (evt) {
                    error();
                };
            }
            else {
                // currently bugged due to the comment
                // ref: https://github.com/mholt/PapaParse/issues/351

                error('Only .xml exports are supported.');
                return;

                //Papa.parse(file, {
                //    comments: '#',
                //    header: true,
                //    encoding: 'UTF-8',
                //    complete: function (results) {
                //        parseCsvErrors(results);

                //        angular.forEach(results.data, function (value, key) {
                //            sites.push({
                //                favorite: false,
                //                uri: value.hostname && value.hostname !== '' ? trimUri(value.hostname) : null,
                //                username: value.username && value.username !== '' ? value.username : null,
                //                password: value.password && value.password !== '' ? value.password : null,
                //                notes: null,
                //                name: getNameFromHost(value.hostname),
                //            });
                //        });

                //        success(folders, sites, siteRelationships);
                //    }
                //});
            }
        }

        function importUpmCsv(file, success, error) {
            Papa.parse(file, {
                encoding: 'UTF-8',
                complete: function (results) {
                    parseCsvErrors(results);

                    var folders = [],
                        sites = [],
                        siteRelationships = [];

                    angular.forEach(results.data, function (value, key) {
                        if (value.length === 5) {
                            sites.push({
                                favorite: false,
                                uri: value[3] && value[3] !== '' ? trimUri(value[3]) : null,
                                username: value[1] && value[1] !== '' ? value[1] : null,
                                password: value[2] && value[2] !== '' ? value[2] : null,
                                notes: value[4] && value[4] !== '' ? value[4] : null,
                                name: value[0] && value[0] !== '' ? value[0] : '--',
                            });
                        }
                    });

                    success(folders, sites, siteRelationships);
                }
            });
        }

        function importKeeperCsv(file, success, error) {
            Papa.parse(file, {
                encoding: 'UTF-8',
                complete: function (results) {
                    parseCsvErrors(results);

                    var folders = [],
                        sites = [],
                        folderRelationships = [];

                    angular.forEach(results.data, function (value, key) {
                        if (value.length >= 6) {
                            var folderIndex = folders.length,
                                siteIndex = sites.length,
                                hasFolder = value[0] && value[0] !== '',
                                addFolder = hasFolder,
                                i = 0;

                            if (hasFolder) {
                                for (i = 0; i < folders.length; i++) {
                                    if (folders[i].name === value[0]) {
                                        addFolder = false;
                                        folderIndex = i;
                                        break;
                                    }
                                }
                            }

                            var site = {
                                favorite: false,
                                uri: value[4] && value[4] !== '' ? trimUri(value[4]) : null,
                                username: value[2] && value[2] !== '' ? value[2] : null,
                                password: value[3] && value[3] !== '' ? value[3] : null,
                                notes: value[5] && value[5] !== '' ? value[5] : null,
                                name: value[1] && value[1] !== '' ? value[1] : '--',
                            };

                            if (value.length > 6) {
                                // we have some custom fields. add them to notes.

                                if (site.notes === null) {
                                    site.notes = '';
                                }
                                else {
                                    site.notes += '\n';
                                }

                                for (i = 6; i < value.length; i = i + 2) {
                                    var cfName = value[i];
                                    var cfValue = value[i + 1];
                                    site.notes += (cfName + ': ' + cfValue + '\n');
                                }
                            }

                            sites.push(site);

                            if (addFolder) {
                                folders.push({
                                    name: value[0]
                                });
                            }

                            if (hasFolder) {
                                var relationship = {
                                    key: siteIndex,
                                    value: folderIndex
                                };
                                folderRelationships.push(relationship);
                            }
                        }
                    });

                    success(folders, sites, folderRelationships);
                }
            });
        }

        function importPasswordDragonXml(file, success, error) {
            var folders = [],
                sites = [],
                folderRelationships = [],
                foldersIndex = [],
                j = 0;

            var reader = new FileReader();
            reader.readAsText(file, 'utf-8');
            reader.onload = function (evt) {
                var xmlDoc = $.parseXML(evt.target.result),
                    xml = $(xmlDoc);

                var pwManager = xml.find('PasswordManager');
                if (pwManager.length) {
                    var records = pwManager.find('> record');
                    if (records.length) {
                        for (var i = 0; i < records.length; i++) {
                            var record = $(records[i]);

                            var accountNameNode = record.find('> Account-Name'),
                                accountName = accountNameNode.length ? $(accountNameNode) : null,
                                userIdNode = record.find('> User-Id'),
                                userId = userIdNode.length ? $(userIdNode) : null,
                                passwordNode = record.find('> Password'),
                                password = passwordNode.length ? $(passwordNode) : null,
                                urlNode = record.find('> URL'),
                                url = urlNode.length ? $(urlNode) : null,
                                notesNode = record.find('> Notes'),
                                notes = notesNode.length ? $(notesNode) : null,
                                categoryNode = record.find('> Category'),
                                category = categoryNode.length ? $(categoryNode) : null,
                                categoryText = category ? category.text() : null;

                            var folderIndex = folders.length,
                                siteIndex = sites.length,
                                hasFolder = categoryText && categoryText !== '' && categoryText !== 'Unfiled',
                                addFolder = hasFolder;

                            if (hasFolder) {
                                for (j = 0; j < folders.length; j++) {
                                    if (folders[j].name === categoryText) {
                                        addFolder = false;
                                        folderIndex = j;
                                        break;
                                    }
                                }
                            }

                            var site = {
                                favorite: false,
                                uri: url && url.text() !== '' ? trimUri(url.text()) : null,
                                username: userId && userId.text() !== '' ? userId.text() : null,
                                password: password && password.text() !== '' ? password.text() : null,
                                notes: notes && notes.text() !== '' ? notes.text() : null,
                                name: accountName && accountName.text() !== '' ? accountName.text() : '--',
                            };

                            var attributesSelector = '';
                            for (j = 1; j <= 10; j++) {
                                attributesSelector += '> Attribute-' + j;
                                if (j < 10) {
                                    attributesSelector += ', ';
                                }
                            }

                            var attributes = record.find(attributesSelector);
                            if (attributes.length) {
                                // we have some attributes. add them to notes.
                                for (j = 0; j < attributes.length; j++) {
                                    var attr = $(attributes[j]),
                                        attrName = attr.prop('tagName'),
                                        attrValue = attr.text();

                                    if (!attrValue || attrValue === '' || attrValue === 'null') {
                                        continue;
                                    }

                                    if (site.notes === null) {
                                        site.notes = '';
                                    }
                                    else {
                                        site.notes += '\n';
                                    }

                                    site.notes += (attrName + ': ' + attrValue);
                                }
                            }

                            sites.push(site);

                            if (addFolder) {
                                folders.push({
                                    name: categoryText
                                });
                            }

                            if (hasFolder) {
                                var relationship = {
                                    key: siteIndex,
                                    value: folderIndex
                                };
                                folderRelationships.push(relationship);
                            }
                        }
                    }

                    success(folders, sites, folderRelationships);
                }
                else {
                    error();
                }
            };

            reader.onerror = function (evt) {
                error();
            };
        }

        function importEnpassCsv(file, success, error) {
            Papa.parse(file, {
                encoding: 'UTF-8',
                complete: function (results) {
                    parseCsvErrors(results);

                    var folders = [],
                        sites = [],
                        siteRelationships = [];

                    for (var j = 0; j < results.data.length; j++) {
                        var row = results.data[j];
                        if (row.length < 2) {
                            continue;
                        }
                        if (j === 0 && row[0] === 'Title') {
                            continue;
                        }

                        var note = row[row.length - 1];
                        var site = {
                            name: row[0],
                            favorite: false,
                            uri: null,
                            password: null,
                            username: null,
                            notes: note && note !== '' ? note : null
                        };

                        if (row.length > 2 && (row.length % 2) === 0) {
                            for (var i = 0; i < row.length - 2; i += 2) {
                                var value = row[i + 2];
                                if (!value || value === '') {
                                    continue;
                                }

                                var field = row[i + 1];
                                var fieldLower = field.toLowerCase();

                                if (fieldLower === 'url' && !site.uri) {
                                    site.uri = trimUri(value);
                                }
                                else if ((fieldLower === 'username' || fieldLower === 'email') && !site.username) {
                                    site.username = value;
                                }
                                else if (fieldLower === 'password' && !site.password) {
                                    site.password = value;
                                }
                                else {
                                    // other custom fields
                                    site.notes = site.notes === null ? field + ': ' + value
                                        : site.notes + '\n' + field + ': ' + value;
                                }
                            }
                        }

                        sites.push(site);
                    }

                    success(folders, sites, siteRelationships);
                }
            });
        }

        function importPasswordSafeXml(file, success, error) {
            var folders = [],
                sites = [],
                folderRelationships = [],
                foldersIndex = [],
                j = 0;

            var reader = new FileReader();
            reader.readAsText(file, 'utf-8');
            reader.onload = function (evt) {
                var xmlDoc = $.parseXML(evt.target.result),
                    xml = $(xmlDoc);

                var pwsafe = xml.find('passwordsafe');
                if (pwsafe.length) {
                    var notesDelimiter = pwsafe.attr('delimiter');

                    var entries = pwsafe.find('> entry');
                    if (entries.length) {
                        for (var i = 0; i < entries.length; i++) {
                            var entry = $(entries[i]);

                            var titleNode = entry.find('> title'),
                                title = titleNode.length ? $(titleNode) : null,
                                usernameNode = entry.find('> username'),
                                username = usernameNode.length ? $(usernameNode) : null,
                                emailNode = entry.find('> email'),
                                email = emailNode.length ? $(emailNode) : null,
                                emailText = email ? email.text() : null,
                                passwordNode = entry.find('> password'),
                                password = passwordNode.length ? $(passwordNode) : null,
                                urlNode = entry.find('> url'),
                                url = urlNode.length ? $(urlNode) : null,
                                notesNode = entry.find('> notes'),
                                notes = notesNode.length ? $(notesNode) : null,
                                notesText = notes ? notes.text().split(notesDelimiter).join('\n') : null,
                                groupNode = entry.find('> group'),
                                group = groupNode.length ? $(groupNode) : null,
                                groupText = group ? group.text().split('.').join(' > ') : null;

                            var folderIndex = folders.length,
                                siteIndex = sites.length,
                                hasFolder = groupText && groupText !== '',
                                addFolder = hasFolder;

                            if (hasFolder) {
                                for (j = 0; j < folders.length; j++) {
                                    if (folders[j].name === groupText) {
                                        addFolder = false;
                                        folderIndex = j;
                                        break;
                                    }
                                }
                            }

                            var site = {
                                favorite: false,
                                uri: url && url.text() !== '' ? trimUri(url.text()) : null,
                                username: username && username.text() !== '' ? username.text() : null,
                                password: password && password.text() !== '' ? password.text() : null,
                                notes: notes && notesText !== '' ? notesText : null,
                                name: title && title.text() !== '' ? title.text() : '--',
                            };

                            if (!site.username && emailText && emailText !== '') {
                                site.username = emailText;
                            }
                            else if (emailText && emailText !== '') {
                                site.notes = site.notes === null ? 'Email: ' + emailText
                                    : site.notes + '\n' + 'Email: ' + emailText;
                            }

                            sites.push(site);

                            if (addFolder) {
                                folders.push({
                                    name: groupText
                                });
                            }

                            if (hasFolder) {
                                var relationship = {
                                    key: siteIndex,
                                    value: folderIndex
                                };
                                folderRelationships.push(relationship);
                            }
                        }
                    }

                    success(folders, sites, folderRelationships);
                }
                else {
                    error();
                }
            };

            reader.onerror = function (evt) {
                error();
            };
        }

        function importDashlaneCsv(file, success, error) {
            Papa.parse(file, {
                encoding: 'UTF-8',
                complete: function (results) {
                    parseCsvErrors(results);

                    var folders = [],
                        sites = [],
                        siteRelationships = [];

                    for (var j = 0; j < results.data.length; j++) {
                        var skip = false;
                        var row = results.data[j];
                        if (!row.length || row.length === 1) {
                            continue;
                        }

                        var site = {
                            name: row[0] && row[0] !== '' ? row[0] : '--',
                            favorite: false,
                            uri: null,
                            password: null,
                            username: null,
                            notes: null
                        };

                        if (row.length === 2) {
                            site.uri = trimUri(row[1]);
                        }
                        else if (row.length === 3) {
                            site.uri = trimUri(row[1]);
                            site.username = row[2];
                        }
                        else if (row.length === 4) {
                            if (row[2] === '' && row[3] === '') {
                                site.username = row[1];
                                site.notes = row[2] + '\n' + row[3];
                            }
                            else {
                                site.username = row[2];
                                site.notes = row[1] + '\n' + row[3];
                            }
                        }
                        else if (row.length === 5) {
                            site.uri = trimUri(row[1]);
                            site.username = row[2];
                            site.password = row[3];
                            site.notes = row[4];
                        }
                        else if (row.length === 6) {
                            if (row[2] === '') {
                                site.username = row[3];
                                site.notes = row[5];
                            }
                            else {
                                site.username = row[2];
                                site.notes = row[3] + '\n' + row[5];
                            }

                            site.uri = trimUri(row[1]);
                            site.password = row[4];
                        }
                        else if (row.length === 7) {
                            if (row[2] === '') {
                                site.username = row[3];
                                site.notes = row[4] + '\n' + row[6];
                            }
                            else {
                                site.username = row[2];
                                site.notes = row[3] + '\n' + row[4] + '\n' + row[6];
                            }

                            site.uri = trimUri(row[1]);
                            site.password = row[5];
                        }
                        else {
                            site.notes = '';
                            for (var i = 1; i < row.length; i++) {
                                site.notes = site.notes + row[i] + '\n';
                                if (row[i] === 'NO_TYPE') {
                                    skip = true;
                                    break;
                                }
                            }
                        }

                        if (site.uri && site.uri.indexOf('.') >= 0) {
                            site.uri = 'http://' + site.uri.toLowerCase().trim();
                        }

                        if (skip) {
                            continue;
                        }

                        if (site.username === '') {
                            site.username = null;
                        }
                        if (site.password === '') {
                            site.password = null;
                        }
                        if (site.notes === '') {
                            site.notes = null;
                        }
                        if (site.uri === '') {
                            site.uri = null;
                        }

                        sites.push(site);
                    }

                    success(folders, sites, siteRelationships);
                }
            });
        }

        function importStickyPasswordXml(file, success, error) {
            var folders = [],
                sites = [],
                folderRelationships = [],
                foldersIndex = [],
                j = 0;

            function buildGroupText(database, groupId, groupText) {
                var group = database.find('> Groups > Group[ID="' + groupId + '"]');
                if (group.length) {
                    if (groupText && groupText !== '') {
                        groupText = ' > ' + groupText;
                    }
                    groupText = group.attr('Name') + groupText;
                    var parentGroupId = group.attr('ParentID');
                    return buildGroupText(database, parentGroupId, groupText);
                }
                return groupText;
            }

            var reader = new FileReader();
            reader.readAsText(file, 'utf-8');
            reader.onload = function (evt) {
                var xmlDoc = $.parseXML(evt.target.result),
                    xml = $(xmlDoc);

                var database = xml.find('root > Database');
                if (database.length) {
                    var logins = database.find('> Logins > Login');
                    if (logins.length) {
                        for (var i = 0; i < logins.length; i++) {
                            var login = $(logins[i]);

                            var usernameText = login.attr('Name'),
                                passwordText = login.attr('Password'),
                                accountId = login.attr('ID'),
                                titleText = null,
                                linkText = null,
                                notesText = null,
                                groupId = null,
                                groupText = null;

                            if (accountId && accountId !== '') {
                                var accountLogin =
                                    database.find('> Accounts > Account > LoginLinks > Login[SourceLoginID="' + accountId + '"]');
                                if (accountLogin.length) {
                                    var account = accountLogin.parent().parent();
                                    if (account.length) {
                                        titleText = account.attr('Name');
                                        linkText = account.attr('Link');
                                        groupId = account.attr('ParentID');
                                        notesText = account.attr('Comments');
                                        if (notesText) {
                                            notesText = notesText.split('/n').join('\n');
                                        }
                                    }
                                }
                            }

                            if (groupId && groupId !== '') {
                                groupText = buildGroupText(database, groupId, '');
                            }

                            var folderIndex = folders.length,
                                siteIndex = sites.length,
                                hasFolder = groupText && groupText !== '',
                                addFolder = hasFolder;

                            if (hasFolder) {
                                for (j = 0; j < folders.length; j++) {
                                    if (folders[j].name === groupText) {
                                        addFolder = false;
                                        folderIndex = j;
                                        break;
                                    }
                                }
                            }

                            var site = {
                                favorite: false,
                                uri: linkText && linkText !== '' ? trimUri(linkText) : null,
                                username: usernameText && usernameText !== '' ? usernameText : null,
                                password: passwordText && passwordText !== '' ? passwordText : null,
                                notes: notesText && notesText !== '' ? notesText : null,
                                name: titleText && titleText !== '' ? titleText : '--',
                            };

                            sites.push(site);

                            if (addFolder) {
                                folders.push({
                                    name: groupText
                                });
                            }

                            if (hasFolder) {
                                var relationship = {
                                    key: siteIndex,
                                    value: folderIndex
                                };
                                folderRelationships.push(relationship);
                            }
                        }
                    }

                    success(folders, sites, folderRelationships);
                }
                else {
                    error();
                }
            };

            reader.onerror = function (evt) {
                error();
            };
        }

        function importmSecureCsv(file, success, error) {
            Papa.parse(file, {
                encoding: 'UTF-8',
                complete: function (results) {
                    parseCsvErrors(results);

                    var folders = [],
                        sites = [],
                        folderRelationships = [];

                    angular.forEach(results.data, function (value, key) {
                        if (value.length >= 3) {
                            var folderIndex = folders.length,
                                siteIndex = sites.length,
                                hasFolder = value[0] && value[0] !== '' && value[0] !== 'Unassigned',
                                addFolder = hasFolder,
                                i = 0;

                            if (hasFolder) {
                                for (i = 0; i < folders.length; i++) {
                                    if (folders[i].name === value[0]) {
                                        addFolder = false;
                                        folderIndex = i;
                                        break;
                                    }
                                }
                            }

                            var site = {
                                favorite: false,
                                uri: null,
                                username: null,
                                password: null,
                                notes: '',
                                name: value[2] && value[2] !== '' ? value[2] : null
                            };

                            if (value[1] === 'Web Logins') {
                                site.uri = value[4] && value[4] !== '' ? trimUri(value[4]) : null;
                                site.username = value[5] && value[5] !== '' ? value[5] : null;
                                site.password = value[6] && value[6] !== '' ? value[6] : null;
                                site.notes = value[3] && value[3] !== '' ? value[3].split('\\n').join('\n') : null;
                            }
                            else if (value.length > 3) {
                                for (var j = 3; j < value.length; j++) {
                                    if (value[j] && value[j] !== '') {
                                        if (site.notes !== '') {
                                            site.notes = site.notes + '\n';
                                        }

                                        site.notes = site.notes + value[j];
                                    }
                                }
                            }

                            if (value[1] && value[1] !== '' && value[1] !== 'Web Logins') {
                                site.name = value[1] + ': ' + site.name;
                            }

                            if (site.notes === '') {
                                site.notes = null;
                            }

                            sites.push(site);

                            if (addFolder) {
                                folders.push({
                                    name: value[0]
                                });
                            }

                            if (hasFolder) {
                                var relationship = {
                                    key: siteIndex,
                                    value: folderIndex
                                };
                                folderRelationships.push(relationship);
                            }
                        }
                    });

                    success(folders, sites, folderRelationships);
                }
            });
        }

        function importTrueKeyJson(file, success, error) {
            var folders = [],
                sites = [],
                siteRelationships = [],
                i = 0;

            var reader = new FileReader();
            reader.readAsText(file, 'utf-8');
            reader.onload = function (evt) {
                var fileContent = evt.target.result;
                var fileJson = JSON.parse(fileContent);
                if (fileJson) {
                    if (fileJson.logins) {
                        for (i = 0; i < fileJson.logins.length; i++) {
                            var login = fileJson.logins[i];
                            sites.push({
                                favorite: login.favorite && login.favorite === true,
                                uri: login.url && login.url !== '' ? trimUri(login.url) : null,
                                username: login.login && login.login !== '' ? login.login : null,
                                password: login.password && login.password !== '' ? login.password : null,
                                notes: null,
                                name: login.name && login.name !== '' ? login.name : '--',
                            });
                        }
                    }

                    if (fileJson.documents) {
                        for (i = 0; i < fileJson.documents.length; i++) {
                            var doc = fileJson.documents[i];
                            var note = {
                                favorite: false,
                                uri: null,
                                username: null,
                                password: null,
                                notes: '',
                                name: doc.title && doc.title !== '' ? doc.title : '--',
                            };

                            if (doc.kind === 'note') {
                                if (!doc.document_content || doc.document_content === '') {
                                    continue;
                                }
                                note.notes = doc.document_content;
                            }
                            else {
                                for (var property in doc) {
                                    if (doc.hasOwnProperty(property)) {
                                        if (property === 'title' || property === 'hexColor' || property === 'kind' ||
                                            doc[property] === '' || doc[property] === null) {
                                            continue;
                                        }

                                        if (note.notes !== '') {
                                            note.notes = note.notes + '\n';
                                        }
                                        note.notes = note.notes + property + ': ' + doc[property];
                                    }
                                }
                            }

                            if (!note.notes || note.notes === '') {
                                continue;
                            }
                            else {
                                note.notes = note.notes.split('\\n').join('\n');
                            }

                            sites.push(note);
                        }
                    }
                }

                success(folders, sites, siteRelationships);
            };

            reader.onerror = function (evt) {
                error();
            };
        }

        function importClipperzHtml(file, success, error) {
            var folders = [],
                sites = [],
                siteRelationships = [];

            var reader = new FileReader();
            reader.readAsText(file, 'utf-8');
            reader.onload = function (evt) {
                var doc = $(evt.target.result);
                var textarea = doc.find('textarea');
                var json = textarea && textarea.length ? textarea.val() : null;
                var entries = json ? JSON.parse(json) : null;

                if (entries && entries.length) {
                    for (var i = 0; i < entries.length; i++) {
                        var entry = entries[i];

                        var site = {
                            favorite: false,
                            uri: null,
                            username: null,
                            password: null,
                            notes: '',
                            name: entry.label && entry.label !== '' ? entry.label.split(' ')[0] : '--',
                        };

                        if (entry.data && entry.data.notes && entry.data.notes !== '') {
                            site.notes = entry.data.notes.split('\\n').join('\n');
                        }

                        if (entry.currentVersion && entry.currentVersion.fields) {
                            for (var property in entry.currentVersion.fields) {
                                if (entry.currentVersion.fields.hasOwnProperty(property)) {
                                    var field = entry.currentVersion.fields[property];
                                    var actionType = field.actionType.toLowerCase();

                                    switch (actionType) {
                                        case 'password':
                                            site.password = field.value;
                                            break;
                                        case 'email':
                                        case 'username':
                                        case 'user':
                                        case 'name':
                                            site.username = field.value;
                                            break;
                                        case 'url':
                                            site.uri = trimUri(field.value);
                                            break;
                                        case 'none':
                                        default:
                                            if (!site.username && isField(field.label, _usernameFieldNames)) {
                                                site.username = field.value;
                                            }
                                            else if (!site.password && isField(field.label, _passwordFieldNames)) {
                                                site.password = field.value;
                                            }
                                            else {
                                                if (site.notes && site.notes !== '') {
                                                    site.notes = site.notes + '\n';
                                                }
                                                site.notes = site.notes + field.label + ': ' + field.value;
                                            }
                                            break;
                                    }
                                }
                            }
                        }

                        if (site.notes === '') {
                            site.notes = null;
                        }

                        sites.push(site);
                    }
                }

                success(folders, sites, siteRelationships);
            };

            reader.onerror = function (evt) {
                error();
            };
        }

        function importAviraJson(file, success, error) {
            var folders = [],
                sites = [],
                siteRelationships = [],
                i = 0;

            var reader = new FileReader();
            reader.readAsText(file, 'utf-8');
            reader.onload = function (evt) {
                var fileContent = evt.target.result;
                var fileJson = JSON.parse(fileContent);
                if (fileJson) {
                    if (fileJson.accounts) {
                        for (i = 0; i < fileJson.accounts.length; i++) {
                            var account = fileJson.accounts[i];
                            var site = {
                                favorite: account.is_favorite && account.is_favorite === true,
                                uri: account.domain && account.domain !== '' ? trimUri(account.domain) : null,
                                username: account.username && account.username !== '' ? account.username : null,
                                password: account.password && account.password !== '' ? account.password : null,
                                notes: null,
                                name: account.label && account.label !== '' ? account.label : account.domain,
                            };

                            if (account.email && account.email !== '') {
                                if (!site.username || site.username === '') {
                                    site.username = account.email;
                                }
                                else {
                                    site.notes = account.email;
                                }
                            }

                            if (!site.name || site.name === '') {
                                site.name = '--';
                            }

                            if (site.uri && !site.uri.startsWith('http')) {
                                site.uri = 'http://' + site.uri;
                            }

                            sites.push(site);
                        }
                    }
                }

                success(folders, sites, siteRelationships);
            };

            reader.onerror = function (evt) {
                error();
            };
        }

        function importRoboFormHtml(file, success, error) {
            var folders = [],
                sites = [],
                siteRelationships = [];

            var reader = new FileReader();
            reader.readAsText(file, 'utf-8');
            reader.onload = function (evt) {
                var doc = $(evt.target.result.split('&shy;').join('').split('<WBR>').join(''));
                var outterTables = doc.find('table.nobr');
                if (outterTables.length) {
                    for (var i = 0; i < outterTables.length; i++) {
                        var outterTable = $(outterTables[i]);
                        var site = {
                            favorite: false,
                            uri: null,
                            username: null,
                            password: null,
                            notes: '',
                            name: outterTable.find('span.caption').text()
                        };

                        var url = outterTable.find('.subcaption').text();
                        if (url && url !== '') {
                            if (!url.startsWith('http')) {
                                url = 'http://' + url;
                            }
                            site.uri = trimUri(url.toLowerCase());
                        }

                        var fields = [];
                        $.each(outterTable.find('table td:not(.subcaption)'), function (indexInArray, valueOfElement) {
                            $(valueOfElement).find('br').replaceWith('\n');
                            var t = $(valueOfElement).text();
                            if (t !== '') {
                                fields.push(t.split('\\n').join('\n'));
                            }
                        });

                        if (fields.length && (fields.length % 2 === 0))
                            for (var j = 0; j < fields.length; j += 2) {
                                var field = fields[j];
                                var fieldValue = fields[j + 1];

                                if (!site.password && isField(field.replace(':', ''), _passwordFieldNames)) {
                                    site.password = fieldValue;
                                }
                                else if (!site.username && isField(field.replace(':', ''), _usernameFieldNames)) {
                                    site.username = fieldValue;
                                }
                                else {
                                    if (site.notes !== '') {
                                        site.notes = site.notes + '\n';
                                    }

                                    site.notes = site.notes + field + ' ' + fieldValue;
                                }
                            }

                        if (!site.notes || site.notes === '') {
                            site.notes = null;
                        }

                        if (!site.name || site.name === '') {
                            site.name = '--';
                        }

                        sites.push(site);
                    }
                }

                success(folders, sites, siteRelationships);
            };

            reader.onerror = function (evt) {
                error();
            };
        }

        function importSaferPassCsv(file, success, error) {
            function urlDomain(data) {
                var a = document.createElement('a');
                a.href = data;
                return a.hostname.startsWith('www.') ? a.hostname.replace('www.', '') : a.hostname;
            }

            var folders = [],
                sites = [],
                siteRelationships = [];

            Papa.parse(file, {
                header: true,
                encoding: 'UTF-8',
                complete: function (results) {
                    parseCsvErrors(results);

                    angular.forEach(results.data, function (value, key) {
                        sites.push({
                            favorite: false,
                            uri: value.url && value.url !== '' ? trimUri(value.url) : null,
                            username: value.username && value.username !== '' ? value.username : null,
                            password: value.password && value.password !== '' ? value.password : null,
                            notes: value.notes && value.notes !== '' ? value.notes : null,
                            name: value.url && value.url !== '' ? urlDomain(value.url) : '--',
                        });
                    });

                    success(folders, sites, siteRelationships);
                }
            });
        }

        return _service;
    });
