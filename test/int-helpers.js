const path = require('path');

const isCI = process.env['CI']; // set by appveyor
const ciMod = isCI ? 3 : 1;
const timeTotal = 2 * 60 * 1000 * ciMod; // locally test runs at < 30 secs
const timeForBackend = 10 * 1000 * ciMod;
const timeStep = 1 * 1000 * ciMod;
const timeStepMax = 1.5 * 1000 * ciMod;
const timeStepMin = 500 * ciMod;
const appPath = path.normalize(`${path.dirname(__dirname)}/linq-editor-win32-x64/linq-editor.exe`);
const connectionString = 
    isCI ? 'Data Source=.\\SQL2014; User Id=sa; Password=Password12!; Initial Catalog=testdb'  
         : 'Data Source=.\\sqlexpress;Integrated Security=True;Initial Catalog=testdb';

const queryText = 'Foo.Select(x => new { Ident = x.Id, SomeDesc = x.Description }).Dump();';

// first create checks for all cell values, ensuring we keep passing the client around, 
// and return it in the end, so it can be awaited. total bullshit logic ftw
function checkTable(client, rows, rowIndex, isBody) {
    if (!rows || rows.length === 0) {
        return client;
    }
    let rowIdx = rowIndex || 1;
    let cellSelector = isBody ? 'td' : 'th';
    let rowSelector = isBody ? 'tbody' : 'thead';
    let rowCheckingClient = rows[0].reduce((wrapped, cellValue, idx) => {
        let selector = `table.table.table-condensed ${isBody ? 'tbody' : 'thead'} 
            tr:nth-child(${rowIdx}) ${isBody ? 'td' : 'th'}:nth-child(${idx + 1})`;
        return wrapped
            .waitForExist(selector, timeForBackend)
            .catch(function(e) { throw e })
            .getText(selector)
            .then(function (val) {
                val.should.equal(cellValue);
            });
    }, client);
    return checkTable(rowCheckingClient, rows.slice(1), isBody ? rowIdx + 1 : 1, true);
}

function checkHints(client, hints) {
    if (!hints || hints.length === 0) {
        return client;
    }
    return hints.reduce((wrapped, hint, idx) => {
        let selector = `ul.CodeMirror-hints li:nth-child(${idx + 1})`;
        return wrapped
            .waitForExist(selector, timeForBackend)
            .catch(function (e) { throw e; })
            .getText(selector)
            .then(function(val) {
                val.should.equal(hint);
            });
    }, client);
}

module.exports = {
    timeTotal,
    timeForBackend,
    timeStep,
    timeStepMax,
    timeStepMin,
    appPath,
    connectionString,
    queryText,
    checkTable,
    checkHints
};