const hello;

const generateSampleReviews = () => {
            const sampleReviews: any[] = [];
            const now = new Date();

            // Generate random reviews over the past 6 months
            for (let i = 0; i < 45; i++) {
                const randomDaysAgo = Math.floor(Math.random() * 180); // Random day in last 6 months

                const reviewDate = new Date(now);
                reviewDate.setDate(reviewDate.getDate() - randomDaysAgo);

                sampleReviews.push({
                    id: `review-${i + 1}`,
                    createdAt: reviewDate,
                    repository: {
                        name: `sample-repo-${Math.floor(Math.random() * 5) + 1}`,
                    },
                    state:
                        Math.random() > 0.2 ? 'APPROVED' : 'CHANGES_REQUESTED',
                    pullRequest: {
                        title: `Fix issue #${Math.floor(Math.random() * 100)}`,
                        number: Math.floor(Math.random() * 500),
                    },
                });
            }

            return sampleReviews;
        };

        const reviews = generateSampleReviews();

        reviews.forEach((review) => {
            const monthKey = keyFor(new Date(review.createdAt));
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].reviews += 1;
            }
        });
