const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const { getHomePackagesModel, getDestinationsModel, getAllPackageItinerariesModel, getAllPackagePoliciesModel, getParticularPackageModel, createBookingsModel } = require('../../model/service/packageModel');
const { urlDecode } = require('../../helper/urlHelper');
const { getAllPackageAssetsModel } = require('../../model/admin/package/adminPackageModel');

const getHomePackages = asyncHandler(async (req, res) => {
    try {
        const domestic = await getHomePackagesModel({ pkg_type: 1 });
        const international = await getHomePackagesModel({ pkg_type: 2 });
        return res.status(200).json({ status: true, msg: 'Top trending and top destination', domestic: domestic, international: international })
    } catch (error) {
        console.log(error);

        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getDestinations = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.condition) {
            return res.status(401).json({ status: false, msg: 'Please add condition' })
        }
        const destinations = await getDestinationsModel(req?.body?.condition);
        console.log(destinations);
        
        return res.status(200).json({ status: true, msg: 'All destinations...', destinations: destinations })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getParticularPackage = asyncHandler(async (req, res, next) => {
    try {
        const packageId = req.query?.id && urlDecode(req?.query?.id);
        if (!packageId) {
            return res.status(400).json({ status: false, msg: 'There is no package found!' })
        }
        const packageData = await getParticularPackageModel({ "packages_master.id": packageId });
        const package = packageData.length > 0 ? packageData[0] : null;
        if (!package) {
            return res.status(400).json({ status: false, msg: 'There is no package found!' })
        }
        package.itineraries = await getAllPackageItinerariesModel({ package_id: package?.id });
        package.assets = await getAllPackageAssetsModel({ package_id: package?.id });
        package.policies = await getAllPackagePoliciesModel({ package_id: package?.id });
        return res.status(200).json({ status: true, msg: 'Here is your package, book now!', package: package })
    } catch (error) {
        next(error)
    }
})

const createBookings = asyncHandler(async (req, res) => {
    try {
        if (!req?.body) {
            return res.status(401).json({ status: false, msg: 'Please add vadid  details for booking' })
        }
        const booking = await createBookingsModel(req?.body);
        return res.status(200).json({ status: true, msg: 'Booking request registered successfully!', booking: booking })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})



module.exports = { getHomePackages, getDestinations, getParticularPackage, createBookings }