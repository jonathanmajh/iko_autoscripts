if interactive == True:
    storeroom = mbo.getMboSet("$LOCATIONS", "LOCATIONS", "SITEID='" + siteid + "' and ISDEFAULT=1")
    room = storeroom.getMbo(0).getString("location")
    fromstoreloc = room
    mbo.setValue("FROMSTORELOC", room)
    errorgroup = "CUSTOM"
    errorkey = room