// Set up
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');

mongoose.connect('mongodb://nanaKwame:king123@ds016118.mlab.com:16118/hospital-ward-backend');

app.use(bodyParser.urlencoded({
    extended: false
})); // Parses urlencoded bodies
app.use(bodyParser.json()); // Send JSON responses
app.use(logger('dev')); // Log requests to API using morgan
app.use(cors());


var Ward = mongoose.model('Ward', {
    ward_number: Number,
    type: String,
    beds: Number,
    max_occupancy: Number,
    cost_per_night: Number,
    reserved: [{
        from: String,
        to: String
    }]
});


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

Ward.remove({}, function (res) {
    console.log('Removed Ward Records')
});

Ward.count({}, function (err, count) {
    console.log("Wards: " + count)

    if (count == 0) {

        var recordsToGenerate = 150;

        var wardTypes = [
            "emergency",
            'maternity',
            'pediatrics',
            'psychiatric',
            'geriatrics',
            'oncology',
            'detoxification'
        ];

        // For testing purposes, all rooms will be booked out from:
        // 18th May 2017 to 25th May 2017, and
        // 29th Jan 2018 to 31 Jan 2018


        for (var i = 0; i < recordsToGenerate; i++) {
            var newWard = new Ward({
                ward_number: i,
                type: wardTypes[getRandomInt(0, 3)],
                beds: getRandomInt(1, 6),
                max_occupancy: getRandomInt(1, 8),
                cost_per_night: getRandomInt(50, 500),
                reserved: [{
                        from: '1970-01-01',
                        to: '1970-01-02'
                    },
                    {
                        from: '2017-04-18',
                        to: '2017-04-23'
                    },
                    {
                        from: '2018-01-29',
                        to: '2018-01-30'
                    }
                ]
            });

            newWard.save(function (err, doc) {
                console.log("Created test document: " + doc._id);
            });
        }
    }
})


app.post('/api/wards', function (req, res) {

    Ward.find({
        type: req.body.wardType,
        beds: req.body.beds,
        max_occupancy: {
            $gt: req.body.patients
        },
        cost_per_night: {
            $gte: req.body.priceRange.lower,
            $lte: req.body.priceRange.upper
        },
        reserved: {
            //Check if any of the dates the room has been reserved for overlap with the requsted dates
            $not: {
                $elemMatch: {
                    from: {
                        $lt: req.body.to.substring(0, 10)
                    },
                    to: {
                        $gt: req.body.from.substring(0, 10)
                    }
                }
            }
        }
    }, function (err, wards) {
        if (err) {
            res.send(err)
        } else {
            res.json(wards)
        }
    })
});

app.post('/api/wards/reserve', function (req, res) {

    console.log(req.body._id)

    Ward.findByIdAndUpdate(req.body._id, {
        $push: {
            "reserved": {
                from: req.body.from,
                to: req.body.to
            }
        }
    }, {
        safe: true,
        new: true
    }, function (err, ward) {
        if (err) {
            res.send(err);
        } else {
            res.json(ward)
        }
    })
})

app.listen(4141 || process.env.PORT);
console.log("App is listening on 4141")