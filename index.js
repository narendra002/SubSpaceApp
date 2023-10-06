const express = require('express');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const port = 3000;

// Initialize caches for analytics and search
const analyticsCache = new Map();
const searchCache = new Map();

// Function to fetch blog data
const fetchData = async () => {
    try {
        const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
            headers: {
                'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
            },
        });

        return response.data.blogs;
    } catch (error) {
        console.error('Error fetching blog data:', error);
        throw error;
    }
};

// Function to get analytics data with caching
const getAnalytics = async () => {
    if (analyticsCache.has('data')) {
        return analyticsCache.get('data');
    }

    const blogData = await fetchData();

    const totalBlogs = blogData.length;
    const longestTitleBlog = _.maxBy(blogData, (blog) => blog.title.length);
    const privacyBlogsCount = blogData.filter((blog) => blog.title.toLowerCase().includes('privacy')).length;
    const uniqueTitles = _.uniqBy(blogData, 'title').map((blog) => blog.title);

    const analyticsData = {
        totalBlogs,
        longestTitle: longestTitleBlog.title,
        privacyBlogsCount,
        uniqueTitles,
    };

    analyticsCache.set('data', analyticsData, 300000); // Cache for 5 minutes (300,000 milliseconds)
    return analyticsData;
};

// Function to get search results with caching
const getSearchResults = async (query) => {
    const cacheKey = `search:${query}`;

    if (searchCache.has(cacheKey)) {
        return searchCache.get(cacheKey);
    }

    const blogData = await fetchData();

    const matchingBlogs = blogData.filter((blog) => blog.title.toLowerCase().includes(query));
    searchCache.set(cacheKey, matchingBlogs, 300000); // Cache for 5 minutes (300,000 milliseconds)
    return matchingBlogs;
};

// API routes
app.get('/api/blog-stats', async (req, res) => {
    try {
        const statistics = await getAnalytics();
        res.json(statistics);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/blog-search', async (req, res) => {
    const query = req.query.query.toLowerCase();

    try {
        const matchingBlogs = await getSearchResults(query);
        res.json(matchingBlogs);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
