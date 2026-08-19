const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const { urlDecode } = require('../../../helper/urlHelper');
const { deleteFile } = require('../../../helper/deleteHelper');
const {
    getAllHotelsModel,
    getParticularHotelModel,
    createHotelModel,
    updateHotelModel,
    deleteHotelModel,
    linkHotelToPackages,
    checkDuplicateHotelSlug
} = require('../../../model/admin/service/adminHotelModel');

const parseSafeJSON = (data, defaultVal = []) => {
    if (!data) return defaultVal;
    if (typeof data === 'object') return data;
    try {
        return JSON.parse(data);
    } catch (e) {
        if (typeof data === 'string' && data.includes(',')) {
            return data.split(',').map(s => s.trim()).filter(Boolean);
        }
        return defaultVal;
    }
};

const normalizeImagePath = (img) => {
    if (!img) return null;
    return img.replace(/\\/g, '/');
};

const getAllHotels = asyncHandler(async (req, res, next) => {
    try {
        let hotels = await getAllHotelsModel();
        hotels = hotels.map(hotel => ({
            ...hotel,
            main_image: normalizeImagePath(hotel.main_image),
            images: parseSafeJSON(hotel.images, []).map(normalizeImagePath),
            amenities: parseSafeJSON(hotel.amenities, []),
            room_types: parseSafeJSON(hotel.room_types, [])
        }));
        return res.status(200).json({
            status: true,
            msg: 'All hotels fetched successfully.',
            hotels: hotels
        });
    } catch (error) {
        next(error);
    }
});

const getAllHotelsDropdown = asyncHandler(async (req, res, next) => {
    try {
        let hotels = await getAllHotelsModel({ status: 1 });
        hotels = hotels.map(hotel => ({
            id: hotel.id,
            name: hotel.name,
            star_rating: hotel.star_rating,
            hotel_type: hotel.hotel_type,
            city_name: hotel.city_name,
            zone_name: hotel.zone_name,
            starting_price: hotel.starting_price,
            main_image: normalizeImagePath(hotel.main_image),
            amenities: parseSafeJSON(hotel.amenities, []).slice(0, 4)
        }));
        return res.status(200).json({
            status: true,
            msg: 'Hotels dropdown fetched.',
            hotels: hotels
        });
    } catch (error) {
        next(error);
    }
});

const getParticularHotel = asyncHandler(async (req, res, next) => {
    try {
        const hotelId = (req?.query?.id && urlDecode(req?.query?.id)) || req?.body?.id || req?.query?.id;
        const slug = req?.query?.slug || req?.body?.slug;

        let hotel = null;
        if (hotelId) {
            hotel = await getParticularHotelModel({ id: hotelId });
        } else if (slug) {
            hotel = await getParticularHotelModel({ slug: slug });
        }

        if (!hotel) {
            return res.status(404).json({ status: false, msg: 'Hotel not found.' });
        }

        hotel.main_image = normalizeImagePath(hotel.main_image);
        hotel.images = parseSafeJSON(hotel.images, []).map(normalizeImagePath);
        hotel.amenities = parseSafeJSON(hotel.amenities, []);
        hotel.room_types = parseSafeJSON(hotel.room_types, []);

        return res.status(200).json({
            status: true,
            msg: 'Hotel details fetched successfully.',
            hotel: hotel
        });
    } catch (error) {
        next(error);
    }
});

const createHotel = asyncHandler(async (req, res, next) => {
    try {
        const body = req.body;
        if (!body?.name) {
            return res.status(400).json({ status: false, msg: 'Hotel name is required.' });
        }

        const generatedSlug = body?.slug
            ? slugify(body.slug, { replacement: '-', lower: true, strict: false, locale: 'vi', trim: true })
            : (slugify(body?.name || '', { replacement: '-', lower: true, strict: false, locale: 'vi', trim: true }) || Date.now().toString());

        const duplicate = await checkDuplicateHotelSlug(generatedSlug, null, body?.name);
        if (duplicate) {
            if (req.files) {
                if (req.files['main_image']) req.files['main_image'].forEach(file => deleteFile(file.path));
                if (req.files['images[]']) req.files['images[]'].forEach(file => deleteFile(file.path));
            }
            return res.status(200).json({
                status: false,
                isDuplicate: true,
                msg: `A hotel with the name "${duplicate.name}" already exists. Please choose a unique name.`
            });
        }

        let mainImagePath = null;
        if (req.files && req.files['main_image'] && req.files['main_image'].length > 0) {
            mainImagePath = req.files['main_image'][0].path;
        }

        let galleryImages = [];
        if (req.files && req.files['images[]'] && req.files['images[]'].length > 0) {
            galleryImages = req.files['images[]'].map(f => f.path);
        }

        let amenities = [];
        if (body?.amenities) {
            if (Array.isArray(body.amenities)) {
                amenities = body.amenities;
            } else if (typeof body.amenities === 'string') {
                try {
                    amenities = JSON.parse(body.amenities);
                } catch (e) {
                    amenities = body.amenities.split(',').map(s => s.trim()).filter(Boolean);
                }
            }
        }

        let roomTypes = [];
        if (body?.room_types) {
            if (Array.isArray(body.room_types)) {
                roomTypes = body.room_types;
            } else if (typeof body.room_types === 'string') {
                try {
                    roomTypes = JSON.parse(body.room_types);
                } catch (e) {
                    roomTypes = [];
                }
            }
        }

        const hotelPayload = {
            name: body.name,
            slug: generatedSlug,
            star_rating: parseInt(body.star_rating) || 3,
            hotel_type: body.hotel_type || 'Resort',
            city_id: body.city_id ? parseInt(body.city_id) : null,
            city_name: body.city_name || null,
            zone_id: body.zone_id ? parseInt(body.zone_id) : null,
            zone_name: body.zone_name || null,
            address: body.address || null,
            starting_price: parseFloat(body.starting_price) || 0.00,
            main_image: mainImagePath,
            images: JSON.stringify(galleryImages),
            amenities: JSON.stringify(amenities),
            room_types: JSON.stringify(roomTypes),
            description: body.description || null,
            check_in_time: body.check_in_time || '12:00 PM',
            check_out_time: body.check_out_time || '11:00 AM',
            contact_number: body.contact_number || null,
            contact_email: body.contact_email || null,
            meta_title: body.meta_title || null,
            meta_description: body.meta_description || null,
            tags: body.tags ? (Array.isArray(body.tags) ? body.tags.join(',') : body.tags) : null,
            status: body.status !== undefined ? parseInt(body.status) : 1
        };

        const result = await createHotelModel(hotelPayload);
        const hotelId = result?.insertId;

        if (!hotelId) {
            return res.status(500).json({ status: false, msg: 'Failed to create hotel record.' });
        }

        // Link to packages if selected
        let packageIds = [];
        if (body?.package_ids) {
            if (Array.isArray(body.package_ids)) {
                packageIds = body.package_ids.map(Number).filter(Boolean);
            } else if (typeof body.package_ids === 'string') {
                try {
                    packageIds = JSON.parse(body.package_ids).map(Number).filter(Boolean);
                } catch (e) {
                    packageIds = body.package_ids.split(',').map(s => Number(s.trim())).filter(Boolean);
                }
            }
        }

        if (packageIds.length > 0) {
            await linkHotelToPackages(hotelId, packageIds);
        }

        return res.status(200).json({
            status: true,
            msg: 'Hotel created successfully!',
            hotel_id: hotelId
        });
    } catch (error) {
        next(error);
    }
});

const updateHotel = asyncHandler(async (req, res, next) => {
    try {
        const body = req.body;
        const hotelId = (body?.hotelId && urlDecode(body?.hotelId)) || body?.id || req?.query?.id;

        if (!hotelId) {
            return res.status(400).json({ status: false, msg: 'Valid Hotel ID is required for update.' });
        }

        const existingHotel = await getParticularHotelModel({ id: hotelId });
        if (!existingHotel) {
            return res.status(404).json({ status: false, msg: 'Hotel not found.' });
        }

        const generatedSlug = body?.slug
            ? slugify(body.slug, { replacement: '-', lower: true, strict: false, locale: 'vi', trim: true })
            : (slugify(body?.name || existingHotel.name, { replacement: '-', lower: true, strict: false, locale: 'vi', trim: true }) || Date.now().toString());

        const duplicate = await checkDuplicateHotelSlug(generatedSlug, hotelId, body?.name);
        if (duplicate) {
            if (req.files) {
                if (req.files['main_image']) req.files['main_image'].forEach(file => deleteFile(file.path));
                if (req.files['images[]']) req.files['images[]'].forEach(file => deleteFile(file.path));
            }
            return res.status(200).json({
                status: false,
                isDuplicate: true,
                msg: `A hotel with the name "${duplicate.name}" already exists. Please choose a unique name.`
            });
        }

        let mainImagePath = existingHotel.main_image;
        if (req.files && req.files['main_image'] && req.files['main_image'].length > 0) {
            mainImagePath = req.files['main_image'][0].path;
            if (existingHotel.main_image) {
                deleteFile(existingHotel.main_image);
            }
        }

        let currentGallery = parseSafeJSON(existingHotel.images, []);
        // Handle delete gallery images
        if (body?.delImages) {
            const delList = parseSafeJSON(body.delImages, []);
            delList.forEach(img => {
                deleteFile(img);
                currentGallery = currentGallery.filter(item => item !== img);
            });
        }

        // Add newly uploaded gallery images
        if (req.files && req.files['images[]'] && req.files['images[]'].length > 0) {
            const newImages = req.files['images[]'].map(f => f.path);
            currentGallery = [...currentGallery, ...newImages];
        }

        let amenities = parseSafeJSON(existingHotel.amenities, []);
        if (body?.amenities !== undefined) {
            if (Array.isArray(body.amenities)) {
                amenities = body.amenities;
            } else if (typeof body.amenities === 'string') {
                try {
                    amenities = JSON.parse(body.amenities);
                } catch (e) {
                    amenities = body.amenities.split(',').map(s => s.trim()).filter(Boolean);
                }
            }
        }

        let roomTypes = parseSafeJSON(existingHotel.room_types, []);
        if (body?.room_types !== undefined) {
            if (Array.isArray(body.room_types)) {
                roomTypes = body.room_types;
            } else if (typeof body.room_types === 'string') {
                try {
                    roomTypes = JSON.parse(body.room_types);
                } catch (e) {
                    roomTypes = [];
                }
            }
        }

        const hotelPayload = {
            name: body.name || existingHotel.name,
            slug: generatedSlug,
            star_rating: body.star_rating !== undefined ? parseInt(body.star_rating) : existingHotel.star_rating,
            hotel_type: body.hotel_type || existingHotel.hotel_type,
            city_id: body.city_id !== undefined ? (body.city_id ? parseInt(body.city_id) : null) : existingHotel.city_id,
            city_name: body.city_name !== undefined ? body.city_name : existingHotel.city_name,
            zone_id: body.zone_id !== undefined ? (body.zone_id ? parseInt(body.zone_id) : null) : existingHotel.zone_id,
            zone_name: body.zone_name !== undefined ? body.zone_name : existingHotel.zone_name,
            address: body.address !== undefined ? body.address : existingHotel.address,
            starting_price: body.starting_price !== undefined ? parseFloat(body.starting_price) : existingHotel.starting_price,
            main_image: mainImagePath,
            images: JSON.stringify(currentGallery),
            amenities: JSON.stringify(amenities),
            room_types: JSON.stringify(roomTypes),
            description: body.description !== undefined ? body.description : existingHotel.description,
            check_in_time: body.check_in_time || existingHotel.check_in_time,
            check_out_time: body.check_out_time || existingHotel.check_out_time,
            contact_number: body.contact_number !== undefined ? body.contact_number : existingHotel.contact_number,
            contact_email: body.contact_email !== undefined ? body.contact_email : existingHotel.contact_email,
            meta_title: body.meta_title !== undefined ? body.meta_title : existingHotel.meta_title,
            meta_description: body.meta_description !== undefined ? body.meta_description : existingHotel.meta_description,
            tags: body.tags !== undefined ? (Array.isArray(body.tags) ? body.tags.join(',') : body.tags) : existingHotel.tags,
            status: body.status !== undefined ? parseInt(body.status) : existingHotel.status
        };

        await updateHotelModel(hotelPayload, { id: hotelId });

        // Update linked packages
        if (body?.package_ids !== undefined) {
            let packageIds = [];
            if (Array.isArray(body.package_ids)) {
                packageIds = body.package_ids.map(Number).filter(Boolean);
            } else if (typeof body.package_ids === 'string') {
                try {
                    packageIds = JSON.parse(body.package_ids).map(Number).filter(Boolean);
                } catch (e) {
                    packageIds = body.package_ids.split(',').map(s => Number(s.trim())).filter(Boolean);
                }
            }
            await linkHotelToPackages(hotelId, packageIds);
        }

        return res.status(200).json({
            status: true,
            msg: 'Hotel updated successfully.'
        });
    } catch (error) {
        next(error);
    }
});

const deleteHotel = asyncHandler(async (req, res, next) => {
    try {
        const hotelId = (req?.query?.id && urlDecode(req?.query?.id)) || req?.body?.id || req?.query?.id;

        if (!hotelId) {
            return res.status(400).json({ status: false, msg: 'Valid Hotel ID is required for deletion.' });
        }

        const existingHotel = await getParticularHotelModel({ id: hotelId });
        if (existingHotel) {
            if (existingHotel.main_image) {
                deleteFile(existingHotel.main_image);
            }
            const gallery = parseSafeJSON(existingHotel.images, []);
            gallery.forEach(img => deleteFile(img));
        }

        // Remove linked packages
        await linkHotelToPackages(hotelId, []);
        await deleteHotelModel({ id: hotelId });

        return res.status(200).json({
            status: true,
            msg: 'Hotel deleted successfully.'
        });
    } catch (error) {
        next(error);
    }
});

// Public Service Endpoints
const getAllHotelsPublic = asyncHandler(async (req, res, next) => {
    try {
        let hotels = await getAllHotelsModel({ status: 1 });
        hotels = hotels.map(hotel => ({
            ...hotel,
            main_image: normalizeImagePath(hotel.main_image),
            images: parseSafeJSON(hotel.images, []).map(normalizeImagePath),
            amenities: parseSafeJSON(hotel.amenities, []),
            room_types: parseSafeJSON(hotel.room_types, [])
        }));
        return res.status(200).json({
            status: true,
            msg: 'All active hotels fetched successfully.',
            hotels: hotels
        });
    } catch (error) {
        next(error);
    }
});

const getParticularHotelPublic = asyncHandler(async (req, res, next) => {
    try {
        let slug = req?.query?.slug || req?.body?.slug;
        let id = req?.query?.id || req?.body?.id;

        let hotel = null;
        if (slug) {
            hotel = await getParticularHotelModel({ slug: slug, status: 1 });
            if (!hotel) {
                try {
                    const decoded = decodeURIComponent(slug);
                    if (decoded !== slug) {
                        hotel = await getParticularHotelModel({ slug: decoded, status: 1 });
                    }
                } catch (e) {}
            }
            if (!hotel && !isNaN(slug)) {
                hotel = await getParticularHotelModel({ id: slug, status: 1 });
            }
        }
        
        if (!hotel && id) {
            let parsedId = id;
            try {
                const decodedId = urlDecode(id);
                if (decodedId) parsedId = decodedId;
            } catch (e) {}
            hotel = await getParticularHotelModel({ id: parsedId, status: 1 });
        }

        if (!hotel) {
            return res.status(404).json({ status: false, msg: 'Hotel not found.' });
        }

        hotel.main_image = normalizeImagePath(hotel.main_image);
        hotel.images = parseSafeJSON(hotel.images, []).map(normalizeImagePath);
        hotel.amenities = parseSafeJSON(hotel.amenities, []);
        hotel.room_types = parseSafeJSON(hotel.room_types, []);

        // Format linked packages
        if (hotel.packages && Array.isArray(hotel.packages)) {
            hotel.packages = hotel.packages.map(pkg => ({
                ...pkg,
                slug: pkg.slug || pkg.id
            }));
        }

        return res.status(200).json({
            status: true,
            msg: 'Hotel details fetched.',
            hotel: hotel
        });
    } catch (error) {
        next(error);
    }
});

module.exports = {
    getAllHotels,
    getAllHotelsDropdown,
    getParticularHotel,
    createHotel,
    updateHotel,
    deleteHotel,
    getAllHotelsPublic,
    getParticularHotelPublic
};
