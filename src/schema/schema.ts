// import { graphql, GraphQLID, GraphQLSchema, GraphQLString } from "graphql";
import { job } from "../types/interfaces";
import { ApolloServer } from "@apollo/server";
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
// const { GraphQLObjectType } = require('graphql');
const express = require("express");



export const Search = (jobs: job[]) => {

    // const JobType = new GraphQLObjectType({
    //     name: 'Job',
    //     fields: () => ({
    //         id: { type: GraphQLID },
    //         name: { type: GraphQLString },
    //         link: { type: GraphQLString },
    //         description: { type: GraphQLString },
    //         company: { type: GraphQLString },
    //         location: { type: GraphQLString },
    //         datePosted: { type: GraphQLString },
    //     })
    // });

    // const Query = new GraphQLObjectType({
    //     name: 'Query',
    //     fields: () => ({
    //         getJobs: {
    //             type: JobType,
    //             resolve(parent: any, args: any) {
    //                 return jobs;
    //             }
    //         },
    //         getJob: {
    //             type: JobType,
    //             args: { id: { type: GraphQLID } },
    //             resolve(parent: any, args: any) {
    //                 return jobs.find(job => job.id === args.id);
    //             }
    //         }
    //     })
    // });
    
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
            // jobsBetweenDates: (parent: any, args: any) => {
            //     const { postedAfter, postedBefore } = args;
            //     return jobs.filter(job => {
            //       const postedDate = job.datePosted ? new Date(job.datePosted) : new Date();
            //       const afterCondition = postedAfter ? postedDate >= new Date(postedAfter) : true;
            //       const beforeCondition = postedBefore ? postedDate <= new Date(postedBefore) : true;
            //       return afterCondition && beforeCondition;
            //     });
            //   },
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


// module.exports = new GraphQLSchema({
//     query: quer
// });
