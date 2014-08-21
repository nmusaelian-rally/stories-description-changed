Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc3/doc/">App SDK 2.0rc3 Docs</a>'},
    launch: function() {
        var that = this;
        var today = new Date().toISOString();
        var stories = Ext.create('Rally.data.wsapi.Store', {
            model: 'UserStory',
            fetch: ['ObjectID', 'FormattedID','Name','RevisionHistory'],
            autoLoad: true,
            filters : [
                {
                property: 'Iteration.StartDate',
                operator: '<=',
                value: today
            },
            {
                property: 'Iteration.EndDate',
                operator: '>=',
                value: today
            }
            ]
        });
        stories.load().then({
            success: this._getRevisionHistory,
            scope: this
        }).then({
            success: this._onModelCreated,
            scope: this
        }).then({
            success: this._onModelLoaded,
            scope: this
        }).then({
            success: this._onRevisionsLoaded,
            scope: this
        }).then({
            success: function(results) {
                console.log('success');
                that._makeGrid(results)
            },
            failure: function(error) {
                console.log("oh noes!", error);
            }
        });
    },
    _getRevisionHistory: function(stories) {
        this._stories = stories;
        console.log('stories', this._stories);
        return Rally.data.ModelFactory.getModel({
            type: 'RevisionHistory'
        });
    },
    
    _onModelCreated: function(model){
        var that = this;
        var promises = [];
        _.each(that._stories, function(story) {
            console.log(story.get('_ref'));
            promises.push(model.load(Rally.util.Ref.getOidFromRef(story.data.RevisionHistory._ref)));
        });
        return Deft.Promise.all(promises);
    },
    
    _onModelLoaded:function(revHistories){
        console.log('revHistories', revHistories);
        var promises = [];
        _.each(revHistories, function(revHistory){
            promises.push( revHistory.getCollection('Revisions',{filters:{property: 'Description',operator: 'contains',value: 'DESCRIPTION changed'}}).load())
        });
        return Deft.Promise.all(promises);
    },
    _onRevisionsLoaded:function(revisions){
        console.log('revisions',revisions);
        return revisions;
        
    },
    _makeGrid: function(revisions){
        var revs = _.flatten(revisions);
        var data = [];
        _.each(revs, function(rev){
            data.push(rev.data);
        })
        
        this.add({
            xtype: 'rallygrid',
            showPagingToolbar: true,
            editable: false,
            store: Ext.create('Rally.data.custom.Store', {
                data: data
            }),
            columnCfgs: [
                {
                    text: 'Description',dataIndex: 'Description',
                },
                {
                    text: 'User',dataIndex: 'User',
                         renderer: function(value){
                            return value._refObjectName;
                         }
                },
                {
                    text: 'CreationDate',dataIndex: 'CreationDate',
                }
            ]
        });
        
    }
});