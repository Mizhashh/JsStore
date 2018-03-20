import { Base } from "./BaseLogic";
import { IInsert } from "../interfaces";
import { IError, Error_Type, ErrorHelper } from "../error_helper";
import { createTransaction, db_transaction } from "./MainLogic";

export class BulkInsert extends Base {
    _query: IInsert;

    constructor(query: IInsert, onSuccess: () => void, onError: (err: IError) => void) {
        super();
        this._query = query;
        this._onSuccess = onSuccess;
        this._onError = onError;
    }

    execute() {
        if (!Array.isArray(this._query.Values)) {
            this.onErrorOccured(
                new ErrorHelper(Error_Type.NotArray).get(),
                true
            );
        }
        else if (this.isTableExist(this._query.Into) === true) {
            try {
                this.bulkinsertData();
            }
            catch (ex) {
                this.onExceptionOccured(ex, { TableName: this._query.Into });
            }
        }
        else {
            var error = new ErrorHelper(Error_Type.TableNotExist, { TableName: this._query.Into });
            error.throw();
        }
    }

    private bulkinsertData() {
        createTransaction([this._query.Into], function (e) {
            this._onSuccess();
        }.bind(this));
        this._objectStore = db_transaction.objectStore(this._query.Into);
        this._query.Values.forEach(function (value) {
            this._objectStore.add(value);
        }, this);
    }
}