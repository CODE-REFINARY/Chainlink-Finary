class Element {}

export class Article extends Element {
        constructor(title="", isPublic=false, date=null, url="", count=0) {
                this.title = title;
                this.public = isPublic;
                this.date = date;
                this.url = url;
                this.count = count;
        }
}

export class Chainlink extends Element {
        constructor(article="", title="", isPublic=false, date=null, url="", count=0, order=0) {
                this.article = fence;
                this.title = title;
                this.public = isPublic;
                this.date = date;
                this.url = url;
                this.count = count;
                this.order = order;
        }
}

export class Content extends Element {
        constructor(tag="", chainlink="", url="", count=0, order=0) {
                this.tag = tag;
                this.chainlink = chainlink;
                this.url = url;
                this.count = count;
                this.order = order;
        }
}
