const express = require('express');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const port = 3000;

let blogData; // Initialize the blogData variable outside the functions

// Middleware to fetch and analyze blog data
const fetchAndAnalyzeBlogData = async () => {
    try {
        // Make a GET request to the third-party API
        const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
            headers: {
                'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
            },
        });

        blogData = response.data; // Update the blogData variable with API response

        // Calculate total number of blogs
        const totalBlogs = blogData.length;

        // Find the blog with the longest title
        const longestTitleBlog = _.maxBy(blogData, (blog) => blog.title.length);

        // Determine the number of blogs with titles containing "privacy"
        const privacyBlogs = _.filter(blogData, (blog) =>
            blog.title.toLowerCase().includes('privacy')
        );

        // Create an array of unique blog titles
        const uniqueTitles = _.uniqBy(blogData, 'title').map((blog) => blog.title);

        // Respond with the statistics
        return {
            totalBlogs,
            longestTitle: longestTitleBlog.title,
            privacyBlogs: privacyBlogs.length,
            uniqueTitles,
        };
    } catch (error) {
        // Handle errors
        console.error('Error fetching or analyzing blog data:', error);
        throw error;
    }
};

// Apply memoization to the function with a cache duration of 5 minutes (300,000 milliseconds)
const memoizedFetchAndAnalyze = _.memoize(fetchAndAnalyzeBlogData, null, 300000);

// Route for fetching blog statistics
app.get('/api/blog-stats', async (req, res) => {
    try {
        const statistics = await memoizedFetchAndAnalyze();
        res.json(statistics);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route for searching blogs
app.get('/api/blog-search', (req, res) => {
    const query = req.query.query.toLowerCase();

    // Filter blogs based on the provided query (case-insensitive)
    const matchingBlogs = blogData.filter((blog) =>
        blog.title.toLowerCase().includes(query)
    );

    res.json(matchingBlogs);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
