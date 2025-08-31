
import { job } from "../types/interfaces";
import { ApolloServer } from "@apollo/server";
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require("express");



export const Search = (jobs: job[]) => {

    
    const typeDefs = `#graphql
        type Job {
            id: ID
            name: String
            link: String
            description: String
            company: String
            location: String
            datePosted: String
        }

        type Query {
            getJobs: [Job]
            getJob(id: ID): Job
            jobsDescriptionHas(descriptionIncludes: String): [Job]
        }
    `;

    const resolvers = {
        Query: {
            getJobs: () => jobs,
            getJob: (parent: any, args: any) => jobs.find(job => job.id === args.id),
            jobsDescriptionHas: (parent: any, args: any) => {
                const { descriptionIncludes } = args;
                return jobs.filter(job => job.description.includes(descriptionIncludes));
            }
        },
    };

    const server = new ApolloServer({ typeDefs, resolvers });

    async function startServer() {
        await server.start();
      
        const app = express();
        app.use('/graphql', cors(), bodyParser.json(), expressMiddleware(server));
      
        app.listen(4000, () => {
          console.log(`Server running at http://localhost:4000/graphql`);
        });
      }
      
      startServer();

}
