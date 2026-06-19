const connection = require('../../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../../helper/modelHelper');

// Post
function getAllPostsModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM posts ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function getAllPostsConditionModel(condition) {
     const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM posts  ${customcondition} ORDER BY id DESC`, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function getParticularPostsModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM posts ${customcondition} ORDER BY id DESC`, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                const newRows = JSON.parse(JSON.stringify(rows))
                resolve(newRows.length > 0 ? newRows[0] : null);
            } else {
                resolve([]);
            }
        });
    })
}

function createPostModel(PostData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO posts SET ?', PostData, (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err);
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });

    })
}

function createFeatureVideoModel(PostData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO videos SET ?', PostData, (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err);
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });

    })
}

function getParticularFeatureVideoModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM posts ${customcondition} ORDER BY id DESC`, (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err);
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                const newRows = JSON.parse(JSON.stringify(rows))
                resolve(newRows.length > 0 ? newRows[0] : []);
            } else {
                resolve([]);
            }
        });

    })
}

function deleteFeatureVideoModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM videos ${customcondition}`, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function updatePostModel(details, condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE posts SET ? ${customcondition}`, [details], (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function deletePostModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM posts ${customcondition}`, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function createTagsModel(PostData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO tags SET ?', PostData, (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err);
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });

    })
}

function getParticularTagsModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM tags ${customcondition} ORDER BY id DESC`, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                const newRows = JSON.parse(JSON.stringify(rows));
                resolve(newRows.length> 0 ? newRows[0] : 0);
            } else {
                resolve([]);
            }
        });
    })
}

function createPostsTagsModel(PostData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO post_tags SET ?', PostData, (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err);
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });

    })
}

function deletePostsTagsModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM post_tags ${customcondition}`, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function getPostTagsModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM post_tags LEFT JOIN tags ON post_tags.tag_id = tags.id ${customcondition} ORDER BY tags.id DESC`, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}


module.exports = {
    getAllPostsModel,
    getAllPostsConditionModel,
    getParticularPostsModel,
    createPostModel,
    updatePostModel,
    deletePostModel,
    createFeatureVideoModel,
    createTagsModel,
    createPostsTagsModel,
    deleteFeatureVideoModel,
    deletePostsTagsModel,
    getParticularTagsModel,
    getPostTagsModel
}