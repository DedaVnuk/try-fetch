import { TryFetchError } from './TryFetchError';
import { isAbortError } from './utils';

type TryFetchProps<Data> = {
	baseUrl: string;
	errorCreator?: (response: Response) => {
		message: TryFetchError['message'];
		data?: Data;
		[key: string]: unknown;
	};
};

type TryFetchSuccessResponse<Data> = {
	ok: boolean;
	refetch: () => Promise<TryFetchSuccessResponse<Data>>;
	data?: Data;
	error?: {
		message: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
};

export class TryFetch<Data = unknown> {
	private baseUrl: string;
	private abortController = new AbortController();
	private fetchState: 'success' | 'error' | 'loading' = 'loading';

	private errorCreator: TryFetchProps<Data>['errorCreator'] = (
		response: Response,
	) => {
		return {
			message: `Status: ${response.status}; message: ${response.statusText}`,
			status: response.status,
			statusText: response.statusText,
		};
	};

	constructor(props: TryFetchProps<Data>) {
		this.baseUrl = props.baseUrl;
		this.errorCreator = props.errorCreator ?? this.errorCreator;
	}

	get state() {
		return this.fetchState;
	}

	async query<T = Data>(
		url: `/${string}`,
		options?: RequestInit & { repeat?: Record<'delay' | 'count', number>; },
	): Promise<TryFetchSuccessResponse<T>> {
		const refetch = async () => await this.query<T>(url, options);

		try {
			this.fetchState = 'loading';
			const response = await fetch(`${this.baseUrl}${url}`, {
				signal: this.abortController.signal,
				...options,
			});

			if(!response.ok) {
				const { message, ...props } = this.errorCreator!(response);
				throw new TryFetchError(message, props);
			}

			this.fetchState = 'success';

			return {
				ok: true,
				refetch,
				data: await response.json(),
			};
		} catch (error: unknown) {
			this.fetchState = 'error';

			let errorData: TryFetchSuccessResponse<T>['error'] = {
				message: 'Default error',
			};

			if(error instanceof TryFetchError) {
				errorData = {
					message: error.message,
					...error.data,
				};
			} else if(isAbortError(error)) {
				errorData.message = 'Query was cancelled';
			}

			return {
				ok: false,
				refetch,
				error: errorData,
			};
		}
	}

	cancel() {
		this.abortController.abort();
	}
}
