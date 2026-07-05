const connection = require('../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../helper/modelHelper');

function getAllPagesConditionModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM page_master ${customcondition} ORDER BY id DESC`, (err, rows) => {
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

function getParticularPagesConditionModel(condition) {
    const customcondition = buildCondition(condition);
    // console.log(customcondition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT common_page.*, page_master.page_name FROM page_master LEFT JOIN common_page ON common_page.page_id = page_master.id ${customcondition} ORDER BY id DESC`, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)) ? JSON.parse(JSON.stringify(rows))[0] : null);
            } else {
                resolve([]);
            }
        });
    })
}


function getAllFaqConditionModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT page_master.page_name, faq_master.* FROM page_master LEFT JOIN faq_master on faq_master.page_id = page_master.id ${customcondition} ORDER BY faq_master.sort_order DESC`, (err, rows) => {
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

function getAllBlogsConditionModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT posts.*, categories.name as category_name, categories.slug  as category_slug FROM posts LEFT JOIN categories on categories.id = posts.category_id  ${customcondition} ORDER BY posts.id DESC LIMIT 4`, (err, rows) => {
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

function getParticularBlogsConditionModel(condition) {
    const customcondition = buildCondition(condition);
    
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT 
                posts.*, 
                categories.name AS category_name, 
                categories.slug AS category_slug,
                -- Combines all the tag names for a single post into a comma-separated string
                GROUP_CONCAT(tags.name) AS post_tags
            FROM posts 
            LEFT JOIN categories ON categories.id = posts.category_id 
            LEFT JOIN post_tags ON posts.id = post_tags.post_id
            LEFT JOIN tags ON post_tags.tag_id = tags.id
            ${customcondition} 
            GROUP BY posts.id
            ORDER BY posts.id DESC`, 
            (err, rows) => {
                if (err) {
                    return reject(new Error("Something went wrong in database! " + err?.message));
                }
                
                if (rows && rows.length > 0) {
                    const formattedRows = JSON.parse(JSON.stringify(rows)).map(row => {
                        return {
                            ...row,
                            // Convert the comma-separated string back into a JavaScript array
                            post_tags: row.post_tags ? row.post_tags.split(',') : []
                        };
                    });
                    
                    // Returns the first post object matching your original logic
                    resolve(formattedRows[0]);
                } else {
                    resolve(null);
                }
            }
        );
    });
}

function getSearchPostsLatestModel(searchKeyword, limit = 5) {
    const searchParam = `%${searchKeyword}%`;
    const queryParams = [
        searchParam, // p.title
        searchParam, // p.summary
        searchParam, // c.name
        searchParam, // t.name
        Number(limit) // LIMIT
    ];
    return new Promise((resolve, reject) => {
        connection.query(`SELECT DISTINCT
            p.id,
            p.title,
            p.slug,
            p.summary,
            p.featured_image,
            p.created_at,
            c.name AS category_name
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE 
            p.status = 1 -- Assumes 1 means published/active
            AND (
                p.title LIKE ? 
                OR p.summary LIKE ? 
                OR c.name LIKE ? 
                OR t.name LIKE ?
            )
        ORDER BY p.created_at DESC 
        LIMIT ?;`, queryParams,
            (err, rows) => {
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

function getTotalCategoryBlogsModel() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT c.name, c.slug, COUNT(p.id) AS total_blogs
            FROM categories c
            LEFT JOIN posts p ON c.id = p.category_id
            WHERE p.status = 1
            GROUP BY c.id LIMIT 5`, (err, rows) => {
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

function getTrendingBlogsModel() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT p.*, c.name AS category_name, COUNT(l.id) AS total_likes
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN post_likes l ON p.id = l.post_id 
            GROUP BY p.id
            ORDER BY total_likes DESC
            LIMIT 3`, (err, rows) => {
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
    getAllPagesConditionModel, 
    getParticularPagesConditionModel, 
    getAllFaqConditionModel, 
    getAllBlogsConditionModel, 
    getParticularBlogsConditionModel, 
    getParticularBlogsConditionModel, 
    getSearchPostsLatestModel, 
    getTotalCategoryBlogsModel,
    getTrendingBlogsModel
 }