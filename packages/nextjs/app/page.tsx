"use client";

import { useEffect, useState } from "react";
import { readContract } from "@wagmi/core";
import type { NextPage } from "next";
import { Chain, createClient, http, isAddress } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { createConfig, useEnsName } from "wagmi";
import { getEnsAvatar, getEnsText } from "wagmi/actions";
// import { isAddress } from "viem";
// import { normalize } from "viem/ens";
// import { useEnsAvatar, useEnsName, useEnsText } from "wagmi";
import { PfpCard } from "~~/components/portfolio/PfpCard";
import { organizations } from "~~/components/portfolio/config/organization.config";
import { PersonData } from "~~/components/portfolio/config/person.config";
import { projectsData } from "~~/components/portfolio/config/projects.config";
import { IconsLinks } from "~~/components/portfolio/icons-links/IconLinks";
// import { EmailLogo } from "~~/components/portfolio/logos/EmailLogo";
// import { GithubLogo } from "~~/components/portfolio/logos/GithubLogo";
// import { XLogo } from "~~/components/portfolio/logos/XLogo";
import { Projects } from "~~/components/portfolio/projects/Projects";
import { BuidlGuidl } from "~~/components/portfolio/socials/BuidlGuidl";
import { Discord } from "~~/components/portfolio/socials/Discord";
import { Email } from "~~/components/portfolio/socials/Email";
import { Etherscan } from "~~/components/portfolio/socials/Etherscan";
import { github } from "~~/components/portfolio/socials/Github";
import { Link } from "~~/components/portfolio/socials/Link";
import { Linkedin } from "~~/components/portfolio/socials/Linkedin";
import { Nounspace } from "~~/components/portfolio/socials/Nounspace";
import { Opensea } from "~~/components/portfolio/socials/Opensea";
import { Telegram } from "~~/components/portfolio/socials/Telegram";
import { Warpcast } from "~~/components/portfolio/socials/Warpcast";
import { X } from "~~/components/portfolio/socials/X";
import { Youtube } from "~~/components/portfolio/socials/Youtube";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { useGlobalState } from "~~/services/store/store";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { wagmiConnectors } from "~~/services/web3/wagmiConnectors";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const Home: NextPage = () => {
  const { data: personConfig } = useScaffoldReadContract({ contractName: "Person", functionName: "getData" });

  const { data: organizationsCount } = useScaffoldReadContract({
    contractName: "Organizations",
    functionName: "getOrgCount",
  });
  const { data: organizationsContract } = useScaffoldContract({ contractName: "Organizations" });

  const [web3Orgs, setWeb3Orgs] = useState<any[]>([]);

  useEffect(
    () => {
      async function get() {
        if (!organizationsContract) return;
        if (!organizationsCount) return;

        const orgs = [];
        for (let i = 0; i < organizationsCount; i++) {
          const result = await readContract(wagmiConfig, {
            abi: organizationsContract.abi,
            address: organizationsContract.address,
            functionName: "getData",
            args: [BigInt(i)],
          });
          orgs.push(result);

          setWeb3Orgs([...orgs]);
        }
      }
      get();
    },
    /* eslint-disable-next-line */
    [organizationsContract?.address, organizationsCount],
  );

  const { isWeb3 } = useGlobalState();

  const [selectedPersonConfig, setSelectedPersonConfig] = useState<any>({ ...PersonData });

  const [selectedOrganizationsConfig, setSelectedOrganizationsConfig] = useState<any>();

  useEffect(() => {
    if (isWeb3) {
      setSelectedPersonConfig({
        addr: PersonData.addr,
        name: PersonData.name,
      });
      setSelectedOrganizationsConfig(web3Orgs);
    } else {
      setSelectedPersonConfig(PersonData);
      setSelectedOrganizationsConfig(organizations);
    }
  }, [personConfig, web3Orgs, isWeb3]);

  const [socialLinks, setSocialLinks] = useState<any[]>([]);

  const [selectedName, setSelectedName] = useState<any>();
  const [selectedImage, setSelectedImage] = useState<string>();
  const [selectedDescription, setSelectedDescription] = useState<any>();

  const { data: fetchedEns } = useEnsName({
    address: selectedPersonConfig.addr,
    chainId: 1,
    query: {
      enabled: isAddress(selectedPersonConfig.addr ?? ""),
    },
  });

  useEffect(() => {
    async function get() {
      const finalLinksArr: any[] = [];
      let finalName;
      let finalImage;
      let finalDescription;

      if (isWeb3) {
        const wagmiConfig = createConfig({
          chains: [mainnet],
          connectors: wagmiConnectors,
          ssr: true,
          client({ chain }) {
            return createClient({
              chain,
              transport: http(getAlchemyHttpUrl(chain.id)),
              ...(chain.id !== (hardhat as Chain).id
                ? {
                    pollingInterval: scaffoldConfig.pollingInterval,
                  }
                : {}),
            });
          },
        });

        const normalizedName = fetchedEns ? normalize(fetchedEns) : "";

        const nickname = await getEnsText(wagmiConfig, { name: normalizedName, key: "name" });
        const description = await getEnsText(wagmiConfig, { name: normalizedName, key: "description" });
        const image = await getEnsAvatar(wagmiConfig, { name: normalizedName });

        // const finalArr = [];

        const link1 = await getEnsText(wagmiConfig, { name: normalizedName, key: "com.twitter" });
        const link2 = await getEnsText(wagmiConfig, { name: normalizedName, key: "com.github" });
        const link3 = await getEnsText(wagmiConfig, { name: normalizedName, key: "com.discord" });
        const link4 = await getEnsText(wagmiConfig, { name: normalizedName, key: "org.telegram" });
        const link5 = await getEnsText(wagmiConfig, { name: normalizedName, key: "email" });

        finalLinksArr.push(
          checkLinkWithTag({
            tag: "X",
            url: link1 as string,
          }),
        );

        finalLinksArr.push(
          checkLinkWithTag({
            tag: "Github",
            url: link2 as string,
          }),
        );

        finalLinksArr.push(
          checkLinkWithTag({
            tag: "Discord",
            url: link3 as string,
          }),
        );

        finalLinksArr.push(
          checkLinkWithTag({
            tag: "Telegram",
            url: link4 as string,
          }),
        );

        finalLinksArr.push(
          checkLinkWithTag({
            tag: "Email",
            url: link5 as string,
          }),
        );

        finalName = nickname;
        finalDescription = description;
        finalImage = image || "";
      } else {
        for (let i = 0; i < selectedPersonConfig.links.length; i++) {
          finalLinksArr.push(checkLinkWithTag(selectedPersonConfig.links[i]));
        }

        finalName = PersonData.name;
        finalImage = PersonData.img;
        finalDescription = PersonData.description;
      }

      setSelectedName(finalName);
      setSelectedDescription(finalDescription);
      setSelectedImage(finalImage);
      setSocialLinks(finalLinksArr);
    }
    get();
  }, [fetchedEns, isWeb3, selectedPersonConfig?.links, selectedPersonConfig?.links?.length]);

  console.log("bleh");

  return (
    <div className="flex flex-col items-center">
      <div className="bg-primary w-full p-4">
        <p className="text-center text-xs">profile loaded from ENS</p>
        <PfpCard
          name={selectedName}
          address={selectedPersonConfig?.addr}
          description={selectedDescription}
          image={selectedImage}
          iconslinks={socialLinks}
        />
      </div>

      <div className="m-4" />

      <div className="text-center text-4xl">Organizations</div>
      <div className="rounded-lg p-2">
        <IconsLinks
          iconsLinks={selectedOrganizationsConfig}
          size="base"
          areIconsRounded={true}
          justify="center"
          align="start"
        />
      </div>
      <div className="p-4 rounded-lg w-full">
        <p className="text-center text-4xl">My Projects</p>
        <Projects projects={projectsData} />
      </div>
    </div>
  );
};

export default Home;

function checkLinkWithTag(link: { url: string; tag: string }) {
  let finalSocialLink;

  if (link.tag === "Github") {
    finalSocialLink = github(link.url);
  } else if (link.tag === "Email") {
    finalSocialLink = Email(link.url);
  } else if (link.tag === "X") {
    finalSocialLink = X(link.url);
  } else if (link.tag === "Discord") {
    finalSocialLink = Discord(link.url);
  } else if (link.tag === "Telegram") {
    finalSocialLink = Telegram(link.url);
  } else if (link.tag === "Warpcast") {
    finalSocialLink = Warpcast(link.url);
  } else if (link.tag === "Youtube") {
    finalSocialLink = Youtube(link.url);
  } else if (link.tag === "Linkedin") {
    finalSocialLink = Linkedin(link.url);
  } else if (link.tag === "BuidlGuidl") {
    finalSocialLink = BuidlGuidl(link.url);
  } else if (link.tag === "Etherscan") {
    finalSocialLink = Etherscan(link.url);
  } else if (link.tag === "Nounspace") {
    finalSocialLink = Nounspace(link.url);
  } else if (link.tag === "Opensea") {
    finalSocialLink = Opensea(link.url);
  } else {
    finalSocialLink = Link(link.url);
  }

  return finalSocialLink;
}
