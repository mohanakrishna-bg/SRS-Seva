import sqlite3
import os
import json

BASE_DIR = "/Users/bgm/my_Projects/SRS/Seva/backend"
DB_PATH = os.path.join(BASE_DIR, "seva.db")

JSON_DATA = """
{
  "20250528_123531.jpeg": "13U_TwNdhL0THngoUv68euRAHKEbeQ53n",
  "20250528_123046.jpeg": "1jF7Sa0RGtIjf4Xy5KpiN-XjjScTwtwYg",
  "20250528_122306.jpeg": "1lrH_mXihYdg4h4s9jkwr6_MXQADoI3QX",
  "20250528_122306 2.jpeg": "1E_Ygu-CRVUVC5T_ALCRLMDhmgt-fIbHy",
  "20250528_121958~2.jpg": "1WlSv8FXePLhx4bgr_a3DbgloxInAXeFI",
  "20250528_121845~2.jpg": "1kmsoqnMv6uGWNY0LKshy_yeslLOAhpWO",
  "20250528_121845.jpeg": "1gq48LetX3h1xXr_O7X6mTiSDZIvUbZYU",
  "20250528_121719.jpeg": "1Vbk7PHL2jlpUY0jBK-RlucByzxp49Hjd",
  "20250528_121623.jpeg": "1LJkA7OCzM57a7EET31DqM7f2-w_xINWo",
  "20250528_121520~2.jpg": "1i7W6r8cBRuaaFfIeDkYXNN1yBLdqmPqH",
  "20250528_121520.jpeg": "1jKNP4pp5-Fg7eZzCqZMGk8zoZQfrB5qk",
  "20250528_121148.jpeg": "1TPapB2ZbAFV_BT5kQ6AEaF46f3GQcPSe",
  "20250528_121057.jpeg": "1K5rxc9Oj61G8TPbB0VRBlvuPPzYEVrob",
  "20250528_120207.jpeg": "1qowDBaLx3H_z7mtC4XsIO8BIsMaRPAOD",
  "20250528_120023.jpeg": "14I_HDTfp2rkiM-jS0wPqPxu-MRQS-kOv",
  "20250528_115532.jpeg": "1ZtQwMfIv-QYNbJCNTueg9ewRYu72Burt",
  "20250528_114959.jpeg": "1KtU3hSdZYjB1E-inQlZAOKzMiHKejXRc",
  "20250528_114940.jpeg": "1miemoP8C3wFownWCU768dxRcK8lzCRgn",
  "20250528_114927.jpeg": "16IQ1OJbW786w4AGBlBUA4R8T4DoxbjF6",
  "20250528_114621.jpeg": "1toSD9qMJ-GCXF930PrbCoXJcAbwFYRoj",
  "20250528_114600.jpeg": "1Il6Mg1a7vepOBjThhTd4EUquz_Cm7c7x",
  "20250528_114505.jpeg": "1CuDjdOv3talgiq7MNnWNveWk95MIFfxt",
  "20250528_114106.jpeg": "13EbqEj14d93IbAVaxZoCOqaL01SUmlyX",
  "20250528_113818.jpeg": "14DIuWsUZqe8lSQW6nYP0dLaUF3tRhbhM",
  "20250528_113753.jpeg": "1SpM6Il13M3pdvtNxtfsKKLPNCIVueqNy",
  "20240707_135436.jpg": "13-1epJ3zw2XAjjbWr44W9KctJhgPmeiB",
  "20240707_135405.jpg": "1vyyVEOwwAdM4LiOrvc6r--2Wxfc4DLnY",
  "20240707_134733.jpg": "1Ml1U3mICyC_8CuOqR4Vsj07XMbyHON4W",
  "20240707_134650.jpg": "1fbcfc39mtgxALtcUeeQ7EWkyVTsjDEEO",
  "20240707_134523.jpg": "1vXARqong598O6mUVRxtw-DTcZf4hoLA8",
  "20240707_134201.jpg": "1oic-bnS3OGA46VR4_xFayCpnAgtZ-0kJ",
  "20240707_134123.jpg": "1kw46pAuHhdSt0dnsLWOr6yO-gP_CbP8L",
  "20240707_133714.jpg": "1DT7R0gG72l8k7KAgYQiIpNh2Bix-FMzs",
  "20240707_133629.jpg": "17s0WqML4QYrXW04lW2eQR0wN17S0iUUr",
  "20240707_133440.jpg": "1noIsamdnzUuCv9CbUIIjBOwmPlOkTD_V",
  "20240707_133349.jpg": "1kyMNVKDZADoj8MmBOYlem5DqllZXb8SL",
  "20240707_132951.jpg": "18RJ4JnRMNXNDz7kHbBzjtixh8_Yr-XbO",
  "20240707_132702.jpg": "1kM8MjuAMbFh36R-LxUFbnAODcMM7lUUj",
  "20240707_132648.jpg": "1a1zv-UNLNurkzWa9QGc0Mf1ecama5Pxv",
  "20240707_132547.jpg": "1ED4k5fjEJ9s80fPozmVOzpgb4hZwhmb4",
  "20240707_131219.jpg": "1uAw8DC4_bgp64LHiygAVXLYsUxDiYaTo",
  "20240707_131051.jpg": "1jkzUeYdXNwIsQ9HfO2KuSltcXvsDPIxo",
  "20240707_125935.jpg": "1SDXj-W0uL605ST5TDkC6nd5mwukHQ4yu",
  "20240707_125447.jpg": "1yIfH-vNi1s10B-isg0N65syW6k8fzg6D",
  "20240707_124810.jpg": "1QM71rYhlvKu729o7HbePZC2CQcqq8ejp",
  "20240707_124655.jpg": "17YmdWIL270ZZF1xkHc2lEoVQop9iNCYN",
  "20240707_124624.jpg": "12Lt7lOAGAsxBF6zXRyRGZkS8K-EZj7W_",
  "20240707_124604.jpg": "1qq213_nqak9z37i8CN7NxdDftckLvbQ9",
  "20240707_124546.jpg": "1GvSyj6LsY9VycUXTFMEw9hlQWc1ZV-kR",
  "20240707_124523.jpg": "1DYdnOg-yznD2eGD2NmBSjKg5iwZyO6Eo",
  "20240707_124502.jpg": "1jhIfnDihhjCgz9QdY6j04cuVzGDwibJw",
  "20240707_124439.jpg": "1Pv6btvMvCWmysGGnM82bKjhmcrDbqpEg",
  "20240707_124337.jpg": "1u-n82oCV1qxf0ZrBUMqvGZqpER-AhpR8",
  "20240707_124312.jpg": "1MZp28mXJSu96w0-xhjnci3Ab2kYIU84v",
  "20240707_124222.jpg": "1jEP1fhCluZEa-tBGkpoDGiqHE9Iq0D2e",
  "20240707_124112.jpg": "1OVClEIgsz_KiLhGlGlPpB4uYfiGz-6kV",
  "20240707_124059.jpg": "1nHKGYkYUrgz_Y32s4l3ZRHq39QWvHQzy",
  "20240707_124030.jpg": "1Ob_gzaO4-q_g3y9iyNROuk4xr2oUlxfy",
  "20240707_124024.jpg": "1vpPWwlQcDNfUcc2c_bDhh_XZfaYTExPu",
  "20240707_123959.jpg": "1esk7-Hg4xH3yF2VhzFTZVUPduWUp7ti5",
  "20240707_123950.jpg": "1PcfS1trEgHXZuwu-qnHLaB-YHRKg30L4",
  "20240707_123921.jpg": "1opP1YfHH13ibEP91WuhVJPIu8hsWQZfc",
  "20240707_123911.jpg": "1zWSyH9MsHKRR4zLITLIgp-q9Q6sFMaBE",
  "20240707_123901.jpg": "1NYrl_mqQUsOqE_FWM7rmro7a9i5_aWi_",
  "20240707_123653.jpg": "1CPsPutAgyb1csX-Gy88cjgitR7BlZd5t",
  "20240707_123601.jpg": "1D_N5qoGEiLtHy10JiCaHnLf5O9we5sKp",
  "20240707_123550.jpg": "1AiDZL9tAG8oqDGwrOwWO7-zsljkHUq4Q",
  "20240707_123534.jpg": "165DOPt_EIzWteJbQYvrTnc4gioXuiPu6",
  "20240707_123029.jpg": "1C4_gQw800267Mhad4ab8LIqzIi_HFXkW",
  "20240707_123007.jpg": "1sb3uvR7QMiIf0ugrUshBwpXmsvKZN-Tw",
  "20240707_122906.jpg": "1k4Y1-i4zl7O7jWIqyVeCBYDEF0VMPVTK",
  "20240707_122828.jpg": "1rdLzNolhPtDJNTNzEnlkdqgGLQp7U0Gh",
  "20240707_122816.jpg": "10-055PUqyZxOZ8xTfT70AJJpKh8Llp0q",
  "20240707_122749.jpg": "1MY08Tvbwa6_ytU1w5wB-BDRKoSCbLSIM",
  "20240707_122529.jpg": "1n_I0grkbBqaSXmpJIHse-05Ho2fAcoNx",
  "20240707_122401.jpg": "1DiA7ediTOymCAhhQyr0gEjDr2uYQoxq8",
  "20240707_122315.jpg": "1O2NJWt5StG1XZ40SH5cffrAvto0o89YN",
  "20240707_122227.jpg": "1--UiHTNJXjr3nNxfPOhj82JbFNuIDr8_",
  "20240707_122137.jpg": "1qlgT9wBhhQI760B8JRf92cV3n4olfvGE",
  "20240707_122003.jpg": "1i9DwEuiR5O0AUtotaRZtJjf7dOsV20Oh",
  "20240707_121942.jpg": "1TaSQGsmiHH-FmzxE40h6rA2blKC-b-Xk",
  "20240707_121913.jpg": "123dqSsm70oKjv7I0VFstc5eoUoNNSo33",
  "20240707_121852.jpg": "1IFZKPGbxSC1a9tc6JMd_CA2NDf4DSoTq",
  "20240707_121825.jpg": "1_CpaBQkOl8_siYuBHYr0DFfnc4qiUSu_",
  "20240707_121806.jpg": "1XQ4GCEmzQUMjYbLEubtLByKyWVcnwVXt",
  "20240707_121635.jpg": "107l7sI-nsNQTYhZRsvcZKer7i3pHFjeb",
  "20240707_121612.jpg": "1GLTZPN5iKyvhIvBrepXGA3SCGqYzCTqC",
  "20240707_121533.jpg": "1-8ptDDULOl1bkSRPvm0YBZogx2Mat0ET",
  "20240707_121213.jpg": "1HrocTn7p3jQ2Lv8NOBJWvOq2HnpfHHgV",
  "20240707_121207.jpg": "10u5vW6D3T7gGzSM47E27R4dDYlFKwtc9",
  "20240707_121157.jpg": "19N5xMaxTf8HupbgGGcwNkUk1qasCHCU4",
  "20240707_121154.jpg": "1YBPZF1luTNA4bYje0JhmQmFEr_Hq-d5x",
  "20240707_120721.jpg": "1vb8KGNH3sz3zwjSJU5KscI9Ur8ixlFGi",
  "20240707_120529.jpg": "1ScdIWsEdswBEucT0LnGjvmyFxBu-3ark",
  "20240707_120515.jpg": "1--YHZrJi7fA8RX7gBYw1MvwHP1oXznH5",
  "20240707_120113.jpg": "1nx1umWo0ed51aHNMKQOEWHG5-4fAl2vD",
  "20240707_120029.jpg": "1M7fwanTvrIQxxnz4WWjcHXDZmiBwEVkT",
  "20240707_115835.jpg": "1t8424hykYSPg79jukXpwg583uXuei63N",
  "20240707_115802.jpg": "1xx4lrNEoI-mgCtNUY-BuqbxmNW6rEc6N",
  "20240707_115324.jpg": "1vhV_x0HHI510TYFNq2TFTBv-c5WCkODl",
  "20240707_115109.jpg": "19VY7NqF5cJu68763wRzz9ZYNlOmS4zqS",
  "20240707_115032.jpg": "1z9QA_h4yuKoGMwA_XwUUU3bvWmIKrX0y",
  "20240707_115025.jpg": "13AOz5mvcCkn05RQSYWUxmEdWa81bkPDr",
  "20240707_115015.jpg": "1cViaxG2YixzK-kF8HJzPBZsgBxJDhfYt",
  "20240707_114908.jpg": "1nwzG4JaCBy-ku6KTd9z3UvIL79Kx68g1",
  "20240707_114902.jpg": "1c_ZHTVg-d4i8lD3EnABkX4bFMRC6NR9g",
  "20240707_114855.jpg": "1JHIxFkXY8JEqtoJ-uelSArDNuzw3cCbQ",
  "20240707_114616.jpg": "18Q0X_9ESAHFtJ39rHnwWh08mPF_LEU17",
  "20240707_114425.jpg": "177bIicY9R2Vqq7MDbomU73iPIAoxb6_6",
  "20240707_114336.jpg": "1q2vhodqBFlt0F5MXSyRVRLnzZNodSLDE"
}
"""

def get_base_name(filename):
    if not filename:
        return ""
    clean = filename.split("=")[0].strip()
    parts = clean.split(".")
    if len(parts) > 1:
        return ".".join(parts[:-1]).lower().strip()
    return clean.lower().strip()

def build_lookup():
    image_map = json.loads(JSON_DATA)
    lookup = {}
    for k, v in image_map.items():
        base = get_base_name(k)
        lookup[base] = v
    return lookup

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT ItemId, ImageLink FROM InventoryItem WHERE ImageLink IS NOT NULL AND ImageLink != ''")
    items = cursor.fetchall()

    lookup = build_lookup()
    updated = 0
    missing = 0

    for item_id, image_link in items:
        # If already http link and not google drive format, ignore maybe
        # Wait, if we want to update it to new links, skip if it already is lh3...
        if image_link.startswith("https://lh3.googleusercontent.com/d/"):
            continue

        base_link = get_base_name(image_link)
        
        if base_link in lookup:
            file_id = lookup[base_link]
            # Form the new direct google usercontent link
            new_link = f"https://lh3.googleusercontent.com/d/{file_id}"
            cursor.execute("UPDATE InventoryItem SET ImageLink = ? WHERE ItemId = ?", (new_link, item_id))
            print(f"Updated ItemId {item_id}: {image_link} -> {new_link}")
            updated += 1
        else:
            print(f"Warning: NOT FOUND in lookup -> ItemId {item_id}: {image_link} (base: {base_link})")
            missing += 1

    conn.commit()
    conn.close()
    print(f"\\nTotal updated: {updated}")
    print(f"Total missing: {missing}")

if __name__ == "__main__":
    main()
