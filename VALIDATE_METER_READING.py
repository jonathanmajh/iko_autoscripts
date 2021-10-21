# Variables:
# newreading, siteid, metername


LIMIT = {
    'GH': {
        'KBD': 500,
    },
}

if interactive == True:
    if siteid in LIMIT:
        site_limit = LIMIT[siteid]
        if metername in site_limit:
            meter_limit = site_limit[metername]
            if int(newreading) > meter_limit:
                warngroup = 'custom'
                warnkey = 'OutOfRangeMeter'
                warnparams = [str(meter_limit)]
                newreading = str(0)

# should meter name be considered?
