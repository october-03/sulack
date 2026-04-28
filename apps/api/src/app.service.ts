import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
	getHello() {
		return {
			message: 'Sulack API is running'
		};
	}

	getHealth() {
		return {
			status: 'ok',
			timestamp: new Date().toISOString()
		};
	}
}
