import { TryFetch } from '../src/TryFetch';

type Todo = {
	userId: number;
	id: number;
	title: string;
	completed: boolean;
};

const tryFetch = new TryFetch<Todo>({
	baseUrl: 'https://jsonplaceholder.typicode.com',
});

describe('success way', () => {
	test('success query', async () => {
		const res = await tryFetch.query('/todos/1');

		expect(res.ok).toBeTruthy();
		expect(res.data).toEqual({
			userId: 1,
			id: 1,
			title: 'delectus aut autem',
			completed: false,
		});
	});

	test('fetch options', async () => {
		const res = await tryFetch.query('/todos/1', {
			cache: 'force-cache',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		expect(res.data).toEqual({
			userId: 1,
			id: 1,
			title: 'delectus aut autem',
			completed: false,
		});
	});

	test('query status', async () => {
		const res = tryFetch.query('/todos');
		expect(tryFetch.state).toBe('loading');
		await res;
		expect(tryFetch.state).toBe('success');
	});
});

describe('error way', () => {
	test('error query', async () => {
		const res = await tryFetch.query('/todo');
		expect(res.ok).toBeFalsy();
		expect(res.error?.message).toEqual('Status: 404; message: Not Found');
	});

	test('custor error format', async () => {
		const tryFetchWithCustomError = new TryFetch({
			baseUrl: 'https://jsonplaceholder.typicode.com',
			errorCreator: (response) => {
				return {
					message: 'Url not exists',
					data: [],
					status: response.status,
				};
			},
		});

		expect(await tryFetchWithCustomError.query('/todo')).toEqual({
			ok: false,
			refetch: expect.any(Function),
			error: {
				message: 'Url not exists',
				status: 404,
				data: [],
			},
		});
	});

	test('refetch', async () => {
		const res = await tryFetch.query('/todo');
		expect(res.ok).toBeFalsy();
		const refetchRes = await res.refetch();
		expect(refetchRes).toEqual({
			ok: false,
			refetch: expect.any(Function),
			error: {
				message: 'Status: 404; message: Not Found',
				status: 404,
				statusText: 'Not Found',
			},
		});
	});

	test('cancel', async () => {
		const res = tryFetch.query('/todos');
		tryFetch.cancel();

		expect(await res).toEqual({
			ok: false,
			refetch: expect.any(Function),
			error: {
				message: 'Query was cancelled',
			},
		});
	});

	test('fake url', async () => {
		const tryFetchFake = new TryFetch({
			baseUrl: '',
		});

		expect(await tryFetchFake.query('/')).toEqual({
			ok: false,
			refetch: expect.any(Function),
			error: {
				message: 'Default error',
			},
		});
	});

	test('error query status', async () => {
		const res = tryFetch.query('/todo');
		expect(tryFetch.state).toBe('loading');
		await res;
		expect(tryFetch.state).toBe('error');
	});
});
