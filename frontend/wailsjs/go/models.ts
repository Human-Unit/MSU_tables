export namespace models {
	
	export class DashboardStats {
	    totalStudents: number;
	    totalTeachers: number;
	    totalGroups: number;
	    totalSubjects: number;
	    recentStudents?: any[];
	    recentTeachers?: any[];
	
	    static createFrom(source: any = {}) {
	        return new DashboardStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalStudents = source["totalStudents"];
	        this.totalTeachers = source["totalTeachers"];
	        this.totalGroups = source["totalGroups"];
	        this.totalSubjects = source["totalSubjects"];
	        this.recentStudents = source["recentStudents"];
	        this.recentTeachers = source["recentTeachers"];
	    }
	}
	export class OptionItem {
	    id: string;
	    label: string;
	
	    static createFrom(source: any = {}) {
	        return new OptionItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	    }
	}
	export class PageResult {
	    items: any[];
	    page: number;
	    pageSize: number;
	    total: number;
	
	    static createFrom(source: any = {}) {
	        return new PageResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.items = source["items"];
	        this.page = source["page"];
	        this.pageSize = source["pageSize"];
	        this.total = source["total"];
	    }
	}

}

export namespace services {
	
	export class CurrentUserView {
	    id: string;
	    personId: string;
	    roleId: string;
	    roleName: string;
	    username: string;
	    fullName: string;
	    email?: string;
	    isActive: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CurrentUserView(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.personId = source["personId"];
	        this.roleId = source["roleId"];
	        this.roleName = source["roleName"];
	        this.username = source["username"];
	        this.fullName = source["fullName"];
	        this.email = source["email"];
	        this.isActive = source["isActive"];
	    }
	}
	export class AuthResponse {
	    token: string;
	    user: CurrentUserView;
	
	    static createFrom(source: any = {}) {
	        return new AuthResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.token = source["token"];
	        this.user = this.convertValues(source["user"], CurrentUserView);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class FacultyOption {
	    id: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new FacultyOption(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	    }
	}
	export class GroupOption {
	    id: string;
	    name: string;
	    vocationId: string;
	    educationYear: number;
	
	    static createFrom(source: any = {}) {
	        return new GroupOption(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.vocationId = source["vocationId"];
	        this.educationYear = source["educationYear"];
	    }
	}
	export class LoginRequest {
	    username: string;
	    password: string;
	
	    static createFrom(source: any = {}) {
	        return new LoginRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.username = source["username"];
	        this.password = source["password"];
	    }
	}
	export class VocationOption {
	    id: string;
	    name: string;
	    facultyId: string;
	
	    static createFrom(source: any = {}) {
	        return new VocationOption(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.facultyId = source["facultyId"];
	    }
	}
	export class ScheduleFilters {
	    faculties: FacultyOption[];
	    vocations: VocationOption[];
	    groups: GroupOption[];
	
	    static createFrom(source: any = {}) {
	        return new ScheduleFilters(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.faculties = this.convertValues(source["faculties"], FacultyOption);
	        this.vocations = this.convertValues(source["vocations"], VocationOption);
	        this.groups = this.convertValues(source["groups"], GroupOption);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

