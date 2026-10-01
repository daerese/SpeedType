import axios from "axios";

export const callExternalApi = async (options) => {
    try {
        const response = await axios(options.config);
        const { data } = response;

        return {
            data,
            error: null,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error;

            const { response } = axiosError;

            let message = "http request failed";

            if (response && response.statusText) {
                message = response.statusText;
            }

            if (axiosError.message) {
                message = axiosError.message;
            }

            if (response && response.data && response.data.message) {
                message = response.data.message;
            }

            return {
                data: null,
                error: {
                    message,
                    // * 2026: The HTTP status code (EX: 404 = not found), so callers can react to it
                    status: response ? response.status : null,
                },
            };
        }

        return {
            data: null,
            error: {
                message: error.message,
            },
        };
    }
};
