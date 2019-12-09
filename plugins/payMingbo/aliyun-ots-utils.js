'use strict';

const _ = require('lodash');
const TableStore = require("tablestore");
const Long = TableStore.Long;
var path=require("path");

var YAML = require('yamljs');

// Load yaml file using YAML.load

var ath_url=path.resolve(__dirname, '../../ath.yaml');
console.log(ath_url);

var config = YAML.load(ath_url);
const client = new TableStore.Client(config);


function TSHelper(){}
function TSGet(){}
function TSSet(){}
function TSRange(){}
function TSCreate(){}

TSCreate.prototype={
	constructor:TSCreate,
	create:function(tableName,pk,handler){
		//{goods_id:Number}
		// [{name: 'goods_id',type: 'INTEGER'}]
		let primary_key=_.map(pk,function (value, index) {
			if(value===Number)value="INTEGER";
			else if(value===String)value="STRING";
			return {name:index,type:value};
		})
		
		var params = {
			tableMeta: {
				tableName: tableName,
				primaryKey:primary_key
			},
			reservedThroughput: {
				capacityUnit: {
					read: 0,
					write: 0
				}
			},
			tableOptions: {
				timeToLive: -1,// 数据的过期时间, 单位秒, -1代表永不过期. 假如设置过期时间为一年, 即为 365 * 24 * 3600.
				maxVersions: 1// 保存的最大版本数, 设置为1即代表每列上最多保存一个版本(保存最新的版本).
			}
		};
		client.createTable(params, handler);
	},
	reset:function(tableName,pk,handler){
		//先删除，后创建
		client.deleteTable({tableName: tableName},()=>{
			this.create(tableName,pk,handler);
	})
	}
}

TSGet.prototype={
	constructor:TSGet,
	tables:[],
	_currentTable:null,
	_currentRow:null,
	_handler:null,
	select:function(tableName){
		this._end();
		this._currentTable={tableName:tableName};
		return this;
	},
	get:function(...primary){
		if(!this._currentRow){
			this._currentRow={primaryKey:[]};
		}
		this._currentRow.primaryKey.push([...primary]);
		return this;
	},
	attr:function(...columns){
		var condition = new TableStore.CompositeCondition(TableStore.LogicalOperator.AND);
		_.each(columns,function(item,index){
			_.each(item,function(value,key){
				condition.addSubCondition(new TableStore.SingleColumnCondition(key, item[key], TableStore.ComparatorType.EQUAL));
			})
		})
		this._currentRow.columnFilter = condition;
		return this;
	},
	take:function(...columns){
		this._currentRow.columnsToGet =[...columns];
		return this;
	},
	exec:function(handler){
		this._handler=handler;
		
		this._end();
		let tb=this.tables;
		this.tables=[];
		
		client.batchGetRow({tables:tb},this._handler);
	},
	trace:function(){
		this._end();
		let tb=this.tables;
		this.tables=[];
		return {tables:tb};
	},
	_endRow:function(){
		_.assign(this._currentTable,this._currentRow);
		this._currentRow=null;
	},
	_end:function(){
		this._endRow();
		
		if(this._currentTable)this.tables.push(this._currentTable);
		this._currentTable=null;
	}
}

TSSet.prototype = {
	constructor:TSSet,
	tables:[],
	_currentTable:null,
	_currentRow:null,
	_handler:null,
	select:function(tableName){
		this._end();
		this._currentTable={tableName:tableName,rows:[]};
		
		return this;
	},
	put:function (...primary) {
		
		
		
		this._endRow();
		this._currentRow={
			type: 'PUT',
			condition: new TableStore.Condition(TableStore.RowExistenceExpectation.IGNORE, null),
			primaryKey: [...primary],
			attributeColumns: [],
			returnContent: { returnType: TableStore.ReturnType.Primarykey }
		}
		return this;
	},
	update:function(...primary){
		this._endRow();
		this._currentRow={
			type: 'UPDATE',
			condition: new TableStore.Condition(TableStore.RowExistenceExpectation.IGNORE, null),
			primaryKey: [...primary],
			attributeColumns: [],
			returnContent: { returnType: TableStore.ReturnType.Primarykey }
		}
		return this;
	},
	expect:function(value){
		switch (value){
			case "default":{
				this._currentRow.condition=new TableStore.Condition(TableStore.RowExistenceExpectation.IGNORE, null);
				break;
			}
			case "exist":{
				this._currentRow.condition=new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_EXIST, null);
				break;
			}
			case "unexist":{
				this._currentRow.condition=new TableStore.Condition(TableStore.RowExistenceExpectation.EXPECT_NOT_EXIST, null);
				break;
			}
		}
		return this;
	},
	attr:function(...columns){
		var condition=_.reduce(columns,function (prev,item,index) {
			return _.concat(prev,_.map(item,function (value, key) {
				return _.pick(item,[key]);
			}));
		},[]);
		
		if(this._currentRow.type=='PUT'){
			this._currentRow.attributeColumns=condition;
		}else{
			this._currentRow.attributeColumns=[{"PUT":condition}];
		}
		return this;
	},
	exec:function(handler){
		this._handler=handler;
		
		this._end();
		let tb=this.tables;
		this.tables=[];
		client.batchWriteRow({tables:tb}, this._handler);
	},
	trace:function(){
		this._end();
		let tb=this.tables;
		this.tables=[];
		return {tables:tb};
	},
	_endRow:function(){
		if(this._currentRow){
			this._currentTable.rows.push(this._currentRow);
			this._currentRow=null;
		}
	},
	_end:function(){
		this._endRow();
		
		if(this._currentTable)this.tables.push(this._currentTable);
		this._currentTable=null;
	}
}

TSRange.prototype={
	constructor:TSRange,
	_tableName:'',
	_params:{},
	select:function(tableName,backward=false){
		this._tableName=tableName;
		this._params={
			tableName: this._tableName,
			direction: TableStore.Direction.FORWARD,
			limit: 5000
		};
		if(_.isBoolean(backward)&&backward==true){
			this._params.direction=TableStore.Direction.BACKWARD;
		}
		return this;
	},
	limit:function(value){
		this._params.limit=value;
		return this;
	},
	range:function(...primary){
		var st=this._params.direction== TableStore.Direction.FORWARD?TableStore.INF_MIN:TableStore.INF_MAX;
		var et=this._params.direction== TableStore.Direction.FORWARD?TableStore.INF_MAX:TableStore.INF_MIN;
		
		this._params.inclusiveStartPrimaryKey=_.reduce(primary,function(prev,value,index){
			let obj={};
			obj[value]=st;
			prev.push(obj);
			return prev;
		},[]);
		this._params.exclusiveEndPrimaryKey=_.reduce(primary,function(prev,value,index){
			let obj={};
			obj[value]=et;
			prev.push(obj);
			return prev;
		},[]);
		
		return this;
	},
	where(...condition){
		//推荐使用where，不再使用equal
		let that=this;
		let condlist=_.map(condition,function(value,key){
			var comtype=that.getKeywards(value);
			if(null==comtype){
				throw new Error("格式不正确");
				return;
			}
			
			var b=_.split(value,comtype);
			var c=b[1];
			if(_.startsWith(c, "'")&&_.endsWith(c,"'")){
				c=_.trim(c,"'");
			}else{
				c=_.toNumber(c);
			}
			b[1]=c;
			return _.concat(b,comtype);
		})
		
		if(condlist.length==1){
			var comparator=that.getComparator(condlist[0][2]);
			this._params.columnFilter=new TableStore.SingleColumnCondition(condlist[0][0],condlist[0][1], comparator);
		}else{
			let lop=TableStore.LogicalOperator.AND;
			var cond= new TableStore.CompositeCondition(lop);
			
			_.each(condlist,function(value,index){
				var comparator=that.getComparator(value[2]);
				cond.addSubCondition(new TableStore.SingleColumnCondition(value[0],value[1], comparator));
			})
			this._params.columnFilter = cond;
			
		}
		return this;
	},
	equal(condition,operator="and",comparator="=="){
		if(_.isEmpty(condition))return this;
		
		let comtype;
		switch(comparator){
			case "==":{comtype=TableStore.ComparatorType.EQUAL;break;}
			case "!=":{comtype=TableStore.ComparatorType.NOT_EQUAL;break;}
			case ">":{comtype=TableStore.ComparatorType.GREATER_THAN;break;}
			case ">=":{comtype=TableStore.ComparatorType.GREATER_EQUAL;break;}
			case "<":{comtype=TableStore.ComparatorType.LESS_THAN;break;}
			case "<=":{comtype=TableStore.ComparatorType.LESS_EQUAL;break;}
		}
		
		let size=_.size(condition);
		if(size==1){
			condition=_.toPairs(condition);
			this._params.columnFilter=new TableStore.SingleColumnCondition(condition[0][0],condition[0][1], comtype);
			return this;
		}
		
		let lop;
		if(operator=="and")lop=TableStore.LogicalOperator.AND;
		else if(operator=="or")lop=TableStore.LogicalOperator.OR
		else lop=TableStore.LogicalOperator.NOT;
		
		var cond= new TableStore.CompositeCondition(lop);
		
		_.each(condition,function(value,index){
			cond.addSubCondition(new TableStore.SingleColumnCondition(index,value, comtype));
		})
		this._params.columnFilter = cond;
		return this;
	},
	take:function(...columns){
		this._params.columnsToGet =[...columns];
		return this;
	},
	trace(){
		return this._params;
	},
	exec:function(handler){
		client.getRange(this._params, handler);
	},
	getKeywards(str){
		var comtypes = ["==", "!=", ">", "<",">=", "<="];
		var len = comtypes.length;
		while (len) {
			len--;
			var com = comtypes[len];
			if (_.includes(str, com)) {
				return com;
			}
		}
	},
	getComparator(comparator){
		var comtype;
		switch(comparator){
			case "==":{comtype=TableStore.ComparatorType.EQUAL;break;}
			case "!=":{comtype=TableStore.ComparatorType.NOT_EQUAL;break;}
			case ">":{comtype=TableStore.ComparatorType.GREATER_THAN;break;}
			case ">=":{comtype=TableStore.ComparatorType.GREATER_EQUAL;break;}
			case "<":{comtype=TableStore.ComparatorType.LESS_THAN;break;}
			case "<=":{comtype=TableStore.ComparatorType.LESS_EQUAL;break;}
		}
		return comtype;
	}
}

TSHelper.prototype={
	constructor:TSHelper,
	toBuffer:function(obj){
		return new Buffer(JSON.stringify(obj))
	},
	toNumber:function(num){
		return Long.fromNumber(num)
	},
	parse:function(data){
		let dt=[];
		
		_.each(data.tables,function(table){
			_.each(table,function(item){
				let attr={};
				_.each(item.attributes,function(column){
					try{
						attr[column["columnName"]] = JSON.parse(column["columnValue"]);
					}catch(e){
						attr[column["columnName"]]= column["columnValue"];
					}
				})
				
				_.each(item.primaryKey,function (hash) {
					attr[hash.name]=hash.value;
				})
				
				dt.push(attr);
			})
		})
		return dt;
	},
	parseRange:function(data){
		let dt=[];
		_.each(data.rows,function (item, index) {
			let attr={};
			_.each(item.primaryKey,function (hash) {
				attr[hash.name]=hash.value;
				try{
					attr[hash.name]=JSON.parse(hash.value);
				}catch(e){
					attr[hash.name]=hash.value;
				}
			})

			_.each(item.attributes,function(column){
				try{
					attr[column["columnName"]] = JSON.parse(column["columnValue"]);
				}catch(e){
					attr[column["columnName"]]= column["columnValue"];
				}
			})
			
			
			dt.push(attr);
		})

		let dat = {entities : dt};
		
		// if(_.has(data,"nextToken")){

  //   		var stringToken = data.nextToken.toString("base64");
		// 	console.log("nextToken", Buffer.from(stringToken,"base64"));
		// 	dat.nextPageToken = stringToken;
		// }

		if(_.has(data,"totalCounts")){
			dat.totalCount= parseInt(data.totalCounts);
		}
		return dat;
	},
	response:function(json){
		var jsonData=JSON.stringify(json);
		var jsonResponse = {
			isBase64Encoded: true,
			statusCode: 200,
			headers: {
				"Content-type": "application/json"
			},
			// base64 encode body so it can be safely returned as JSON value
			body: new Buffer(jsonData).toString('base64')
		}
		return jsonResponse;
	}
}

exports.TSHelper=new TSHelper();
exports.TSGet=new TSGet();
exports.TSSet=new TSSet();
exports.TSRange=new TSRange();
exports.TSCreate=new TSCreate();
exports.client=client;
exports.TableStore = TableStore;