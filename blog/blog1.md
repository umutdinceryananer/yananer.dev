---
title: "A Basic Introduction to Agents"
date: "2025-02-17"
---

Hello, this is my first article and I think I will write here what I know about the software topics that interest me and I like. Let me convey my respect to Çağıl teacher, who stated that it is a better idea to show people what I know by writing a blog than my previous idea.

Recently I've been diving into the HuggingFace Agents course and have been spending a lot of time in the Cursor IDE. Although I'm still a beginner, I recently came across the concept of ‘agents’ working behind the scenes and this piqued my interest. In this context, I will try to go into the details of the definition at a simple level. As I said, I am a beginner and this article is written to reinforce what I know rather than to educate.

<aside> 

**Agent**: **AI model capable of reasoning, planning, and interacting with its environment**.

</aside>

The agents we use are very good at understanding human language and can not only understand language but also take action. Before this action phase, they start the action by reasoning and planning.

The reason why they are called agents is that they can actually communicate with the environment with the tools they have access to.

Basically an agent consists of 2 parts;

1.  **The Brain** (AI Model - usually an LLM): Realises Reasoning and Planning stages. The brain deals with which action to take according to different situations.
2.  **The Body**: This is actually the scale of actions that can be taken. The equipment with which the agents are equipped is included in this section.

AI Model Types used in Agents Generally, LLM (text-to-text) AI Models are used in agent development. However, in addition to these, visual understanding and processing models called VLM can also be used.

The toolkit that agents have is actually the basis of many events that astonish us when done by AI today.

In this context, a special tool needs to be developed for each situation, and while we can sometimes use tools made by others, sometimes we need to create our own tools.

Here it is necessary to mention two different concepts that are often confused. The words Tool and Action do not have the same meaning. Action is usually a final event that can be achieved with one or more tools.

### Examples of Agents in Daily Life
Devices such as personal virtual assistants are actually tools developed with Agent logic. Siri, Alexa and Google Assistant give you the right to automatically handle some events without knowing how it happens in the background. When you ask Siri to set an alarm, you are not interested in the background of the action, but since the Alarm application is one of Siri's Tools, it can interact with it and perform the Alarm setting action.

Customer Service Chatbots is another Agent application. These chatbots can usually respond quickly to people who ask questions using the company's database as a tool. Such Agents have predetermined goals such as increasing customer satisfaction while producing answers and strive for that goal.

As a final application, the empowerment of NPC characters with agents in current games can be given as an example. This integration aims to make NPCs more dynamic and unpredictable.

### Conclusion

Agents are basically LLM-like artificial intelligence models and tools to handle different actions.

They can understand natural spoken language properly thanks to their LLMs. They can create road maps for actions to be taken by Reasoning and Planning.

Thank you for reading!
