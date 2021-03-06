import { NotWhere } from "./not_where";
import { promiseAll, promise } from "../../helpers/index";

export class In extends NotWhere {
    protected executeInLogic(column, values) {
        let cursor: IDBCursorWithValue, cursorRequest;
        const columnStore = this.objectStore.index(column);
        let runInLogic: (val) => Promise<void> = (value) => {
            return promise<void>((res, rej) => {
                cursorRequest = columnStore.openCursor(this.getKeyRange(value));
                cursorRequest.onsuccess = (e) => {
                    cursor = e.target.result;
                    if (cursor) {
                        if (shouldAddValue()) {
                            ++this.resultCount;
                        }
                        cursor.continue();
                    }
                    else {
                        res();
                    }
                };
                cursorRequest.onerror = rej;
            });
        };
        let shouldAddValue: () => boolean;

        if (this.checkFlag) {
            shouldAddValue = () => {
                return this.whereCheckerInstance.check(cursor.value);
            };
        }
        else {
            if (this.objectStore.count) {
                runInLogic = (value) => {
                    return promise((res, rej) => {
                        cursorRequest = columnStore.count(this.getKeyRange(value));
                        cursorRequest.onsuccess = (e) => {
                            this.resultCount += e.target.result;
                            res();
                        };
                        cursorRequest.onerror = rej;
                    });
                };
            }
            else {
                shouldAddValue = () => {
                    return true;
                };
            }
        }

        promiseAll(
            values.map(function (val) {
                return runInLogic(val);
            })
        ).then(() => {
            this.onQueryFinished();
        }).catch(err => {
            this.onErrorOccured(err);
        });
    }
}