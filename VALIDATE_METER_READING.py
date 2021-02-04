LIMIT = {
    'GH': 500,
    'GV': 1000,
}

if interactive == True:
    if siteid in LIMIT:
        site_limit = LIMIT[siteid]
        if int(newreading) > site_limit:
            warngroup = 'custom'
            warnkey = 'OutOfRangeMeter'
            warnparams = [str(site_limit)]
            newreading = str(0)

# should meter name be considered?