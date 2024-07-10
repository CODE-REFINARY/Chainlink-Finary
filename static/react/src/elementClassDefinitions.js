export class Element {
        constructor() {}
}

export class Collection extends Element {
        constructor(text="", url="", date=null, isPublic=false, count=0, order=0) {
                super();
                this.type = "collection";
                this.text = text;
                this.url = url;
                this.date = date;
                this.is_public = isPublic;
                this.count = count;
                this.order = order;
        }
}

/*
        Header elements appear in the #header-display section right above the chainlink display (main body). The title
        Header type is must be defined before any other header elements are defined.
 */
export class Header extends Element {
        constructor(type, text="", url="") {
                super();
                this.type = type;
                this.text = text;
                this.url = url;
        }
}

export class Footer extends Element {
        constructor(type, text="", url="") {
                super();
                this.type = type;
                this.text = text;
                this.url = url;
        }
}

export class Chainlink extends Element {
        constructor(type, text, url, date=null, isPublic=true, count=0, order=0) {
                super();
                this.type = type;
                this.text = text;
                this.url = url;
                this.date = date;
                this.is_public = isPublic;
                this.count = count;
                this.order = order;
        }
}

/*
 * The purpose of this class is to define a set of fields that are always defined for Elements that appear underneath
 * Chainlink elements. This class is analogous to the "Body" class defined in Patchwork/models.py.
 */
export class Content extends Element {
        constructor(tag, text, url, date=null, isPublic=true, order=0) {
                super();
                this.type = tag;        // this is useful to identify what kind of Element this is.
                this.url = url;         // this is the identifier of the Chainlink that this Element lives under
                this.date = date;       // this is the same as the date from models.py Body class.
                this.is_public = isPublic;      // also from Body class

                // This should match the order of this Element relative to others under this Chainlink. This should
                // match the database value for the identically named `order` field.
                this.order = order;
        }

}
