/**
 * Manages a list of objects.
 * Objects may be patched. Then, they can be referenced using the 'ref' (string) property.
 */
class ObjectList {

    constructor() {
        this._items = []
    }

    get() {
        return this._items
    }

    add(item) {
        this.addAt(item, this._items.length);
    }

    addAt(item, index) {
        if (index >= 0 && index <= this._items.length) {
            let currentIndex = this._items.indexOf(item)
            if (currentIndex === index) {
                return item;
            }

            if (currentIndex != -1) {
                this.setAt(item, index)
            } else {
                this._items.splice(index, 0, item);
                this.onAdd(item, index)
            }
        } else {
            throw new Error('addAt: The index ' + index + ' is out of bounds ' + this._items.length);
        }
    }

    setAt(item, index) {
        if (index >= 0 && index <= this._items.length) {
            let currentIndex = this._items.indexOf(item)
            if (currentIndex != -1) {
                if (currentIndex !== index) {
                    const fromIndex = currentIndex
                    if (fromIndex <= index) {
                        index--
                    }
                    if (fromIndex !== index) {
                        this._items.splice(fromIndex, 1)
                        this._items.splice(index, 0, item)
                        this.onMove(item, fromIndex, index)
                    }
                }
            } else {
                // Doesn't exist yet: overwrite current.
                this._items[index] = item
                this.onSet(item, index)
            }
        } else {
            throw new Error('setAt: The index ' + index + ' is out of bounds ' + this._items.length);
        }
    }

    getAt(index) {
        return this._items[index]
    }

    getIndex(item) {
        return this._items.indexOf(item)
    }

    remove(item) {
        let index = this._items.indexOf(item)

        if (index !== -1) {
            this.removeAt(index)
        }
    };

    removeAt(index) {
        let item = this._items[index]

        this._items.splice(index, 1);

        this.onRemove(item, index)

        return item;
    };

    clear() {
        let n = this._items.length
        if (n) {
            let prev = this._items
            this._items = []
            this.onSync(prev, [], [])
        }
    };

    a(o) {
        if (Utils.isObjectLiteral(o)) {
            let c = this.createItem(o);
            c.patch(o);
            this.add(c);
            return c;
        } else if (Array.isArray(o)) {
            for (let i = 0, n = o.length; i < n; i++) {
                this.a(o[i]);
            }
            return null;
        } else if (this.isItem(o)) {
            this.add(o);
            return o;
        }
    };

    get length() {
        return this._items.length;
    }

    _getRefs() {
        let refs = {}
        for (let i = 0, n = this._items.length; i < n; i++) {
            let ref = this._items[i].ref
            if (ref) {
                refs[ref] = this._items[i]
            }
        }
        return refs
    }

    patch(settings) {
        if (Utils.isObjectLiteral(settings)) {
            this._setByObject(settings)
        } else if (Array.isArray(settings)) {
            this._setByArray(settings)
        }
    }

    _setByObject(settings) {
        // Overrule settings of known referenced items.
        // If no item exists, add it automatically if __create is set, otherwise ignore.
        let refs = this._getRefs()
        let crefs = Object.keys(settings)
        for (let i = 0, n = crefs.length; i < n; i++) {
            let cref = crefs[i]
            let s = settings[cref]

            let c = refs[cref]
            if (!c && s.__create) {
                // Create new item.
                let c = this.createItem(s)
                c.ref = cref
                this.add(c)
            }
            if (c) {
                if (this.isItem(s)) {
                    // Replace previous item
                    let idx = this.getIndex(c)
                    this.setAt(s, idx)
                } else {
                    c.patch(s)
                }
            }
        }
    }

    _equalsArray(array) {
        let same = true
        if (array.length === this._items.length) {
            for (let i = 0, n = this._items.length; (i < n) && same; i++) {
                same = same && (this._items[i] === array[i])
            }
        } else {
            same = false
        }
        return same
    }

    _setByArray(array) {
        // For performance reasons, first check if the arrays match exactly and bail out if they do.
        if (this._equalsArray(array)) {
            return
        }

        for (let i = 0, n = this._items.length; i < n; i++) {
            this._items[i].marker = true
        }

        let refs
        let newItems = []
        for (let i = 0, n = array.length; i < n; i++) {
            let s = array[i]
            if (this.isItem(s)) {
                newItems.push(s)
            } else {
                let cref = s.ref
                let c
                if (cref) {
                    if (!refs) refs = this._getRefs()
                    c = refs[cref]
                    c.marker = false
                }

                if (!c) {
                    // Create new item.
                    c = this.createItem(s)
                }

                c.patch(s)
                newItems.push(c)
            }
        }

        this._setItems(newItems)
    }

    _setItems(newItems) {
        let prevItems = this._items
        this._items = newItems

        // Remove the items.
        let removed = prevItems.filter(item => {let m = item.marker; delete item.marker; return m})
        let added = newItems.filter(item => !item.marker)

        this.onSync(removed, added, newItems)
    }

    onAdd(item, index) {
    }

    onRemove(item, index) {
    }

    onSync(removed, added, order) {
    }

    onSet(item, index) {
    }

    onMove(item, fromIndex, toIndex) {
    }

    createItem(object) {
        throw new Error("ObjectList.createItem must create and return a new object")
    }

    isItem(object) {
        return false
    }

}

let Utils = require('./Utils');
module.exports = ObjectList;

