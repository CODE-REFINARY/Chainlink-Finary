export class Element {
        constructor() {}
}

export class Collection extends Element {
        constructor(title="", url="", date=null, isPublic=false, count=0, order=0) {
                super();
                this.type = "collection";
                this.text = title;
                this.url = url;
                this.date = date;
                this.is_public = isPublic;
                this.count = count;
                this.order = order;
        }
}

export class Header extends Element {
        constructor(text="", url="") {
                super();
                this.text = text;
                this.url = url;
        }
}

export class Footer extends Element {
        constructor(text="", url="") {
                super();
                this.text = text;
                this.url = url;
        }
}

export class Chainlink extends Element {
        constructor(text, url, date=null, isPublic=true, count=0, order=0) {
                super();
                this.type = "chainlink";
                this.text = text;
                this.url = url;
                this.date = date;
                this.is_public = isPublic;
                this.count = count;
                this.order = order;
        }
}

export class Content extends Element {
        constructor(tag, text, url, date=null, isPublic=true, count=0, order=0) {
                super();
                this.type = tag;
                this.text = text;
                this.url = url;
                this.date = date;
                this.is_public = isPublic;
                this.count = count;
                this.order = order;
        }

}
