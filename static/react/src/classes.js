class Element {
        constructor() {}
}

export class Article extends Element {
        constructor(title="", url="", date=null, isPublic=false, count=0, order=0) {
                super();
                this.title = title;
                this.url = url;
                this.date = date;
                this.public = isPublic;
                this.count = count;
                this.order = order;
        }
}

export class Chainlink extends Element {
        constructor(title="", url="", date=null, isPublic=true, count=0, order=0) {
                super();
                this.title = title;
                this.url = url;
                this.date = date;
                this.public = isPublic;
                this.count = count;
                this.order = order;
        }
}

export class Content extends Element {
        constructor(tag="", content="", url="", date=null, isPublic=true, count=0, order=0) {
                super();
                this.tag = tag;
                this.content = content;
                this.url = url;
                this.date = date;
                this.public = isPublic;
                this.count = count;
                this.order = order;
        }
}
