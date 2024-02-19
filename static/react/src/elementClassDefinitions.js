export class Element {
        constructor() {}
}

export class Article extends Element {
        constructor(title="", url="", date=null, isPublic=false, count=0, order=0) {
                super();
                this.type = "article";
                this.title = title;
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

export class Chainlink extends Element {
        constructor(title="", url="", date=null, isPublic=true, count=0, order=0) {
                super();
                this.type = "header2";
                this.title = title;
                this.url = url;
                this.date = date;
                this.is_public = isPublic;
                this.count = count;
                this.order = order;
        }
}

export class Content extends Element {
        constructor(tag="", content="", url="", date=null, isPublic=true, count=0, order=0) {
                super();
                this.type = tag;
                this.content = content;
                this.url = url;
                this.date = date;
                this.is_public = isPublic;
                this.count = count;
                this.order = order;
        }

        /*get content() {
                return this.content;
        }

        set content(newValue) {
                this.content = newValue;
        }*/
}
