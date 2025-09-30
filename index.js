



function cl(str){
    console.log('NRviteyss    ',str);
}


module.exports = function(RED) {
    function mInstance(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var ws = undefined;
        var sws = undefined;
        //console.log("mInstance created");
        this.server = RED.nodes.getNode(config.server);
        //console.log("got config ....");
        var nconf = this.server;
        var sc0 = undefined;
        var thisConfigIsOk = undefined;
        var errConfId = '';
        cl(['nconf', nconf]);
        var status = 'ok';
        
        if( nconf == null ){
            cl('no nconf found.');
            status = 'no config';

        }else{

            
            cl('----my Conf: '+nconf.id+'---------id: '+this.id+'------------name: '+this.name);
            setTimeout(()=>{
                cl("\n\n---------------\n\n");

                cl("status of config check: "+thisConfigIsOk);
                if( thisConfigIsOk == undefined ){
                    
                    thisConfigIsOk = true;
                    mkServer();
                }else if( thisConfigIsOk == false ){
                    mkError("Config is used by: "+errConfId);
                }
                
            },500);
            
            RED.nodes.eachNode( ( nod )=>{
                if( nod.type== 'viteyss-instance' && nod.id != node.id ){
                    if( nod.server == nconf.id ){
                        errConfId = nod.id;
                        cl("-------- different node use sema config !!");
                        cl( nod );
                        thisConfigIsOk = false;
                    }
                }          
                
            } );
            
        }

        function wsCallBack( ws, isFrom, msg = undefined ){
            //console.log(`wsCallBack got is from [${isFrom}] msg...`,msg);
            bufStr = '';
            if( msg != undefined ){
                bufStr = msg.toString();
                /*
                if( bufStr.substring(0,3) == 'SM:' ){
                    node.send( {" topic":"SM", "payload":bufStr.substring(3) } );
                
                }else if( bufStr.substring(0,8) == 'SMToAll:' ){
                    let pay = bufStr.substring(8);
                    node.send({ "topic":"SMToAll","payload":pay });

                }else */
                if( bufStr.substring(0,10) == 'toMqttPub:' ){
                    let o = bufStr.substring(10).split(',');
                    let nMsg = {};
                    for( let p=0,pc=o.length; p<pc; p++ ){
                        let t = o[p].split('=');
                        nMsg[ t[0] ] = t[1];
                    }
                    nMsg['target'] = 'mqtt';
                    node.send( nMsg );
                    

                }else{
                    node.send( {'topic':'viteyss/msg', 'isFrom': isFrom, 'payload': bufStr } );
                }

            }else{
                node.send( {'topic':'viteyss/'+isFrom, 'isFrom': isFrom } );
            }
        }

        function mkError(str){
            node.status({'text':str, fill:"red"});
        }

        function mkServer(){
            if( nconf.host ){
                node.status({
                    'text':'running..'+(nconf.runhttps?'(s)':'')+' :'+nconf.port, 
                    fill:"green"
                });
                var serCon = require('viteyss/serverContainerVite');
                var path = require("path");
                var nyss = require('node-yss');
                var nvy  = require('viteyss/telMeYourHome');
                console.log('nviteyss',nvy);
                var nysspath = nyss.telMeYourHome(`node-red-contrib-viteyss ${nconf.iname}`);
                var nviteysspath = nvy.telMeYourHome(`node-red-contrib-viteyss ${nconf.iname}`);
                console.log('viteyss path : '+nviteysspath);


                
                let sOpts = nconf.sitesopts.split(',');
                var pathsToSites = [
                    // dev 
                    //'/home/yoyo/Apps/oiyshTerminal/ySS_calibration/sites',
                ];

                if( sOpts.indexOf('node-yss') != -1 ){
                    // node-yss / sites
                    pathsToSites.push( path.join( nysspath, 'yss', 'sites' ) );
                }
                if( sOpts.indexOf('viteyss/sites') != -1 ){
                    // viteyss / sites
                    pathsToSites.push( path.join( nviteysspath, 'sites') );
                }
                if( sOpts.indexOf('node-red') != -1 ){
                    // [.node-red]/sites
                    pathsToSites.push( path.resolve( './sites') );
                }
                if( sOpts.indexOf('home') != -1 ){
                    // if you have `~/.viteyss/sites
                    pathsToSites.push( path.join( process.env.HOME, '.viteyss', 'sites' ) );
                }
                var pathToSitesPackages = [];
                if( sOpts.indexOf('plugins') != -1 ){
                    // sites ass a plugins `viteyss-site-`
                    var { vysPlugins, pcNpmls, vysPluginRuning } = require('viteyss/startItAsPluginColector');


                    

                    if( 1 ){
                        let resOfPc = pcNpmls();
                        console.log("---------------------res pc:["+resOfPc+"]",
                            "vysPlugins",vysPlugins
                        );
                        if( Object.keys( vysPlugins ).length > 0 ){
                            Object.keys( vysPlugins ).forEach((pkey)=>{
                                pathsToSites.push( vysPlugins[pkey].pathTo );
                                // add path to sites from packages 
                                let ptp = {
                                    "package":vysPlugins[pkey].package,
                                    "pathTo":vysPlugins[pkey].pathTo
                                };
                                pathToSitesPackages.push( ptp );
                            });
                        }
                    }
                }
                if( nconf.pathstosites != '' ){
                    for(let sd of nconf.pathstosites.split(','))
                        pathsToSites.push( sd );
                }


                //let pathToYss = '/home/yoyo/Apps/oiyshTerminal/ySS_calibration';
                let pathToYss = nconf.pathtoyss == ''? path.join( nysspath ,"yss" ) : nconf.pathtoyss;

               
                let hostPublicIp = nconf.hostpublicip;
                var config0 = {
                    'https': nconf.runhttps,
                    'name': nconf.iname,
                    'HOST': nconf.host,
                    'PORT': nconf.port,
                    'wsHOST': nconf.wshost,
                    'wsPORT': nconf.wsport,
                    'pathToYss': pathToYss,
                    'pathsToSites': pathsToSites,  
                    "pathsToSitesPackages": pathToSitesPackages,  
                    //'wsInjection': false,
                    'wsInjection': true,
                    
                    'sitesInjection': true,
                    'ws': undefined,
                    'wsPinger': true
                };

                if( nconf.runhttps == true ){
                    config0['yssWSUrl'] = `wss://${hostPublicIp}:${config0.PORT}/fooWSS`;
                } else {
                    config0['yssWSUrl'] = `ws://${hostPublicIp}:${config0.wsPORT}`;
                }
                
                sc0 = new serCon.serverContainerVite(0, config0, wsCallBack );
                try{
                    sc0.initServers();
                    cl(`starting [${nconf.name}]...`);
                    sc0.startServer();
                    sws = sc0.http.wss;
                    ws = sc0.http.ws;

                }catch(e){
                    console.info('[e] viteyss can\'t start server \n',e,"\n------------");
                }
                
            }

        }

        node.on('close', function(dane) {
            cl("on close ...");
            sc0.stopServer();
        });

        node.on('input', function(msg) {
            //cl("on input ....");
            if( msg.rawMsg != undefined && msg.payload ){
                console.log('rawMsg ',msg.payload);
                res = sc0.onWsMessage({
                    'send': (str)=>{
                        node.send({
                            'topic':'rawMsgBack',
                            'payload':str
                        });
                    }
                }, 'on_message', msg.payload);


            } else {   
                sws.sendToAll( ws, JSON.stringify(msg));
            }
            if( status != 'ok' )
                node.send({'error':status});
        });
    }
    RED.nodes.registerType("viteyss-instance",mInstance);

    function mconfig(n){
        RED.nodes.createNode(this,n);
        //console.log('mconfig ',n);
        this.id = n.id;
        this.iname = n.iname;
        this.hostpublicip = n.hostpublicip;
        this.runhttps = n.runhttps;
        this.host = n.host;
        this.port = n.port;
        this.wshost = n.wshost;
        this.wsport = n.wsport;
        this.pathstosites = n.pathstosites;
        this.pathtoyss = n.pathtoyss;
        //this.ysswsurl = n.ysswsurl;
        this.sitesopts = n.sitesopts;

        function getIname(){
            return this.iname;
        }

    }
    RED.nodes.registerType("viteyss-config",mconfig);
}